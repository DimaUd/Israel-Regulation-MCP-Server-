#!/usr/bin/env node
/**
 * Standalone MCP Server for Israel Regulation (regulation.gov.il)
 * Runs over standard input/output (stdio) for Claude Desktop, Cursor, Windsurf, Cline, etc.
 * 
 * Usage:
 *   npx -y tsx mcp-server/index.ts
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createRegulationMcpServer } from '../src/server/mcpServer.ts';

async function main() {
  const server = createRegulationMcpServer();
  const transport = new StdioServerTransport();

  process.on('SIGINT', async () => {
    await server.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await server.close();
    process.exit(0);
  });

  await server.connect(transport);
  console.error('Israel Regulation MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in MCP Server:', error);
  process.exit(1);
});
