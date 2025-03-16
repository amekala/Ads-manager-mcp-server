import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import { db, pool } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

// Create MCP server instance
export const mcpServer = new McpServer({
  name: "PostgreSQL-MCP",
  version: "1.0.0"
});

// Add schema inspection resource
mcpServer.resource(
  "schema",
  "schema://tables",
  async (uri) => {
    const tablesQuery = `
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `;
    
    const result = await pool.query(tablesQuery);
    
    const schemaText = result.rows
      .reduce((acc: any[], row) => {
        const table = acc.find(t => t.table === row.table_name);
        if (table) {
          table.columns.push({
            name: row.column_name,
            type: row.data_type,
            nullable: row.is_nullable === 'YES'
          });
        } else {
          acc.push({
            table: row.table_name,
            columns: [{
              name: row.column_name,
              type: row.data_type,
              nullable: row.is_nullable === 'YES'
            }]
          });
        }
        return acc;
      }, [])
      .map(table => 
        `Table: ${table.table}\n` +
        table.columns.map((col: any) => 
          `  ${col.name} ${col.type}${col.nullable ? ' NULL' : ' NOT NULL'}`
        ).join('\n')
      )
      .join('\n\n');

    return {
      contents: [{
        uri: uri.href,
        text: schemaText
      }]
    };
  }
);

// Add query tool
mcpServer.tool(
  "query",
  {
    sql: z.string(),
    params: z.array(z.any()).optional()
  },
  async ({ sql, params }) => {
    try {
      // Basic SQL injection prevention
      if (sql.toLowerCase().includes('drop') || 
          sql.toLowerCase().includes('truncate') ||
          sql.toLowerCase().includes('alter')) {
        throw new Error('DDL operations not allowed');
      }

      const result = await pool.query(sql, params);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(result.rows, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error: ${(error as Error).message}`
        }],
        isError: true
      };
    }
  }
);

// Add CRUD tools for users table
mcpServer.tool(
  "createUser",
  {
    username: z.string(),
    password: z.string()
  },
  async ({ username, password }) => {
    try {
      const [user] = await db.insert(users)
        .values({ username, password })
        .returning();
        
      return {
        content: [{
          type: "text",
          text: JSON.stringify(user, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error creating user: ${(error as Error).message}`
        }],
        isError: true
      };
    }
  }
);

mcpServer.tool(
  "getUser",
  {
    id: z.number()
  },
  async ({ id }) => {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, id)
      });

      if (!user) {
        return {
          content: [{
            type: "text",
            text: `User not found with id: ${id}`
          }],
          isError: true
        };
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify(user, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error fetching user: ${(error as Error).message}`
        }],
        isError: true
      };
    }
  }
);

mcpServer.tool(
  "listUsers",
  {},
  async () => {
    try {
      const users = await db.query.users.findMany();
      return {
        content: [{
          type: "text",
          text: JSON.stringify(users, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error listing users: ${(error as Error).message}`
        }],
        isError: true
      };
    }
  }
);
