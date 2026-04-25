/**
 * Vercel Serverless Function - GHL MCP Server
 * Routes all requests to the compiled GHLMCPHttpServer Express app
 */

// We need to require the compiled TypeScript output
// The dist folder is built during Vercel's build step via `npm run build`
let app;

function getApp() {
  if (!app) {
    // Dynamically require the compiled server
    // We extract the Express app from the GHLMCPHttpServer class
    const express = require('express');
    const cors = require('cors');
    const { GHLApiClient } = require('../dist/clients/ghl-api-client');
    const { ContactTools } = require('../dist/tools/contact-tools');
    const { ConversationTools } = require('../dist/tools/conversation-tools');
    const { BlogTools } = require('../dist/tools/blog-tools');
    const { OpportunityTools } = require('../dist/tools/opportunity-tools');
    const { CalendarTools } = require('../dist/tools/calendar-tools');
    const { EmailTools } = require('../dist/tools/email-tools');
    const { LocationTools } = require('../dist/tools/location-tools');
    const { EmailISVTools } = require('../dist/tools/email-isv-tools');
    const { SocialMediaTools } = require('../dist/tools/social-media-tools');
    const { MediaTools } = require('../dist/tools/media-tools');
    const { ObjectTools } = require('../dist/tools/object-tools');
    const { AssociationTools } = require('../dist/tools/association-tools');
    const { CustomFieldV2Tools } = require('../dist/tools/custom-field-v2-tools');
    const { WorkflowTools } = require('../dist/tools/workflow-tools');
    const { SurveyTools } = require('../dist/tools/survey-tools');
    const { StoreTools } = require('../dist/tools/store-tools');
    const { ProductsTools } = require('../dist/tools/products-tools');
    const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
    const { SSEServerTransport } = require('@modelcontextprotocol/sdk/server/sse.js');
    const { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } = require('@modelcontextprotocol/sdk/types.js');

    app = express();

    // CORS
    app.use(cors({
      origin: '*',
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      credentials: true
    }));

    app.use(express.json());

    // Request logging
    app.use((req, res, next) => {
      console.log(`[GHL MCP] ${req.method} ${req.path} - ${new Date().toISOString()}`);
      next();
    });

    // Security middleware
    app.use('/sse', (req, res, next) => {
      const auth = req.headers.authorization;
      if (auth !== `Bearer ${process.env.MCP_SECRET_KEY}`) {
        console.warn('[SECURITY] Unauthorized access attempt to /sse');
        res.status(401).send('Unauthorized');
        return;
      }
      next();
    });

    // Initialize GHL client
    const config = {
      accessToken: process.env.GHL_API_KEY || '',
      baseUrl: process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com',
      version: '2021-07-28',
      locationId: process.env.GHL_LOCATION_ID || ''
    };

    if (!config.accessToken) throw new Error('GHL_API_KEY is required');
    if (!config.locationId) throw new Error('GHL_LOCATION_ID is required');

    const ghlClient = new GHLApiClient(config);

    // Initialize all tool sets
    const contactTools = new ContactTools(ghlClient);
    const conversationTools = new ConversationTools(ghlClient);
    const blogTools = new BlogTools(ghlClient);
    const opportunityTools = new OpportunityTools(ghlClient);
    const calendarTools = new CalendarTools(ghlClient);
    const emailTools = new EmailTools(ghlClient);
    const locationTools = new LocationTools(ghlClient);
    const emailISVTools = new EmailISVTools(ghlClient);
    const socialMediaTools = new SocialMediaTools(ghlClient);
    const mediaTools = new MediaTools(ghlClient);
    const objectTools = new ObjectTools(ghlClient);
    const associationTools = new AssociationTools(ghlClient);
    const customFieldV2Tools = new CustomFieldV2Tools(ghlClient);
    const workflowTools = new WorkflowTools(ghlClient);
    const surveyTools = new SurveyTools(ghlClient);
    const storeTools = new StoreTools(ghlClient);
    const productsTools = new ProductsTools(ghlClient);

    // Build full tools list
    const allTools = [
      ...contactTools.getToolDefinitions(),
      ...conversationTools.getToolDefinitions(),
      ...blogTools.getToolDefinitions(),
      ...opportunityTools.getToolDefinitions(),
      ...calendarTools.getToolDefinitions(),
      ...emailTools.getToolDefinitions(),
      ...locationTools.getToolDefinitions(),
      ...emailISVTools.getToolDefinitions(),
      ...socialMediaTools.getTools(),
      ...mediaTools.getToolDefinitions(),
      ...objectTools.getToolDefinitions(),
      ...associationTools.getTools(),
      ...customFieldV2Tools.getTools(),
      ...workflowTools.getTools(),
      ...surveyTools.getTools(),
      ...storeTools.getTools(),
      ...productsTools.getTools()
    ];

    console.log(`[GHL MCP] Loaded ${allTools.length} tools`);

    // Tool executor
    async function executeTool(name, args) {
      if (contactTools.getToolDefinitions().find(t => t.name === name)) return contactTools.executeTool(name, args);
      if (conversationTools.getToolDefinitions().find(t => t.name === name)) return conversationTools.executeTool(name, args);
      if (blogTools.getToolDefinitions().find(t => t.name === name)) return blogTools.executeTool(name, args);
      if (opportunityTools.getToolDefinitions().find(t => t.name === name)) return opportunityTools.executeTool(name, args);
      if (calendarTools.getToolDefinitions().find(t => t.name === name)) return calendarTools.executeTool(name, args);
      if (emailTools.getToolDefinitions().find(t => t.name === name)) return emailTools.executeTool(name, args);
      if (locationTools.getToolDefinitions().find(t => t.name === name)) return locationTools.executeTool(name, args);
      if (emailISVTools.getToolDefinitions().find(t => t.name === name)) return emailISVTools.executeTool(name, args);
      if (socialMediaTools.getTools().find(t => t.name === name)) return socialMediaTools.executeTool(name, args);
      if (mediaTools.getToolDefinitions().find(t => t.name === name)) return mediaTools.executeTool(name, args);
      if (objectTools.getToolDefinitions().find(t => t.name === name)) return objectTools.executeTool(name, args);
      if (associationTools.getTools().find(t => t.name === name)) return associationTools.executeTool(name, args);
      if (customFieldV2Tools.getTools().find(t => t.name === name)) return customFieldV2Tools.executeTool(name, args);
      if (workflowTools.getTools().find(t => t.name === name)) return workflowTools.executeTool(name, args);
      if (surveyTools.getTools().find(t => t.name === name)) return surveyTools.executeTool(name, args);
      if (storeTools.getTools().find(t => t.name === name)) return storeTools.executeTool(name, args);
      if (productsTools.getTools().find(t => t.name === name)) return productsTools.executeTool(name, args);
      throw new Error(`Unknown tool: ${name}`);
    }

    // Health check
    app.get('/', (req, res) => {
      res.json({
        status: 'healthy',
        server: 'ghl-mcp-server',
        version: '1.0.0',
        protocol: '2024-11-05',
        timestamp: new Date().toISOString(),
        toolCount: allTools.length,
        endpoint: '/sse'
      });
    });

    app.get('/health', (req, res) => {
      res.json({ status: 'healthy', toolCount: allTools.length });
    });

    // MCP SSE endpoint
    const transports = {};

    app.get('/sse', async (req, res) => {
      const transport = new SSEServerTransport('/messages', res);
      const mcpServer = new Server(
        { name: 'ghl-mcp-server', version: '1.0.0' },
        { capabilities: { tools: {} } }
      );

      mcpServer.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: allTools }));

      mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        try {
          const result = await executeTool(name, args || {});
          return { content: [{ type: 'text', text: typeof result === 'string' ? result : JSON.stringify(result) }] };
        } catch (error) {
          throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error.message}`);
        }
      });

      transports[transport.sessionId] = transport;
      res.on('close', () => delete transports[transport.sessionId]);
      await mcpServer.connect(transport);
    });

    app.post('/messages', async (req, res) => {
      const sessionId = req.query.sessionId;
      const transport = transports[sessionId];
      if (!transport) {
        res.status(400).json({ error: 'No active SSE session' });
        return;
      }
      await transport.handlePostMessage(req, res);
    });
  }

  return app;
}

module.exports = (req, res) => {
  try {
    const application = getApp();
    application(req, res);
  } catch (error) {
    console.error('[GHL MCP] Fatal error:', error);
    res.status(500).json({ error: 'Server initialization failed', details: error.message });
  }
};
