// Loaded before the real bot entrypoint. No Discord or Anthropic request is sent.
const {Client, Events} = require('discord.js');
const {REST} = require('@discordjs/rest');

Client.prototype.login = function (token) {
  if (token !== 'startup-smoke-token') throw new Error('Unexpected Discord token');
  setImmediate(() => this.emit(Events.ClientReady, {user: {tag: 'startup-smoke-bot'}}));
  return Promise.resolve('startup-smoke-token');
};

REST.prototype.put = async function (route, options) {
  if (!route.includes('123456789012345678') || options?.body?.[0]?.name !== 'ask') {
    throw new Error('Bot registered unexpected command route or body');
  }
  console.log('TURNARCHIST_BOT_STARTUP_SMOKE_OK');
  return [];
};
