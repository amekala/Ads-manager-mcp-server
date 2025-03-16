import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import { db, pool } from "../db";
import { advertisingProfiles, campaigns, adGroups, metrics, users } from "@shared/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";

// Create MCP server instance
export const mcpServer = new McpServer({
  name: "Amazon-Ads-MCP",
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

// Campaign Performance Analysis Tool
mcpServer.tool(
  "analyzeCampaignPerformance",
  {
    campaignId: z.string(),
    dateRange: z.object({
      start: z.string(),
      end: z.string()
    }).optional()
  },
  async ({ campaignId, dateRange }) => {
    try {
      const query = db.select({
        campaign: campaigns,
        metrics: metrics
      })
      .from(campaigns)
      .leftJoin(metrics, eq(metrics.campaignId, campaigns.campaignId))
      .where(eq(campaigns.campaignId, campaignId));

      if (dateRange) {
        query.where(and(
          gte(metrics.date, new Date(dateRange.start)),
          lte(metrics.date, new Date(dateRange.end))
        ));
      }

      const results = await query;

      return {
        content: [{
          type: "text",
          text: JSON.stringify(results, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error analyzing campaign: ${(error as Error).message}`
        }],
        isError: true
      };
    }
  }
);

// Ad Group Performance Tool
mcpServer.tool(
  "analyzeAdGroupPerformance",
  {
    adGroupId: z.string()
  },
  async ({ adGroupId }) => {
    try {
      const results = await db.select()
        .from(adGroups)
        .leftJoin(metrics, eq(metrics.adGroupId, adGroups.adGroupId))
        .where(eq(adGroups.adGroupId, adGroupId))
        .orderBy(desc(metrics.date));

      return {
        content: [{
          type: "text",
          text: JSON.stringify(results, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error analyzing ad group: ${(error as Error).message}`
        }],
        isError: true
      };
    }
  }
);

// Budget Optimization Tool
mcpServer.tool(
  "optimizeBudget",
  {
    profileId: z.string()
  },
  async ({ profileId }) => {
    try {
      // Get all campaigns and their performance metrics
      const results = await db.select()
        .from(campaigns)
        .leftJoin(metrics, eq(metrics.campaignId, campaigns.campaignId))
        .where(eq(campaigns.profileId, profileId))
        .orderBy(desc(metrics.roas));

      // Simple budget optimization logic
      const analysis = results.map(campaign => ({
        campaignId: campaign.campaignId,
        name: campaign.name,
        currentBudget: campaign.budget,
        roas: campaign.roas,
        recommendation: campaign.roas > 2 ? 'Increase budget' : 
                       campaign.roas < 1 ? 'Decrease budget' : 
                       'Maintain budget'
      }));

      return {
        content: [{
          type: "text",
          text: JSON.stringify(analysis, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error optimizing budget: ${(error as Error).message}`
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

// Add Performance Trends Analysis Tool after the existing tools
mcpServer.tool(
  "analyzeTrends",
  {
    profileId: z.string(),
    dateRange: z.object({
      start: z.string(),
      end: z.string()
    })
  },
  async ({ profileId, dateRange }) => {
    try {
      const results = await db.select()
        .from(metrics)
        .where(and(
          eq(metrics.profileId, profileId),
          gte(metrics.date, new Date(dateRange.start)),
          lte(metrics.date, new Date(dateRange.end))
        ))
        .orderBy(metrics.date);

      // Calculate trends
      const trends = {
        impressions: {
          total: results.reduce((sum, r) => sum + r.impressions, 0),
          daily: results.map(r => ({ date: r.date, value: r.impressions }))
        },
        clicks: {
          total: results.reduce((sum, r) => sum + r.clicks, 0),
          daily: results.map(r => ({ date: r.date, value: r.clicks }))
        },
        spend: {
          total: results.reduce((sum, r) => Number(sum) + Number(r.spend), 0),
          daily: results.map(r => ({ date: r.date, value: r.spend }))
        },
        roas: {
          average: results.reduce((sum, r) => Number(sum) + Number(r.roas || 0), 0) / results.length,
          daily: results.map(r => ({ date: r.date, value: r.roas }))
        }
      };

      return {
        content: [{
          type: "text",
          text: JSON.stringify(trends, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error analyzing trends: ${(error as Error).message}`
        }],
        isError: true
      };
    }
  }
);