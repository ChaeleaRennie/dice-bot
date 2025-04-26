require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on('messageCreate', (message) => {
  if (message.author.bot) return;

  const content = message.content.trim();

  // Extended match: ?roll, ?r, ?radv, ?rdis
  const rollRegex = /^\?(roll|r|radv|rdis)\b/i;
  const match = content.match(rollRegex);
  if (!match) return;

  // Determine mode based on shortcut command
  const command = match[1].toLowerCase();
  let mode;
  if (command === 'radv') mode = 'adv';
  if (command === 'rdis') mode = 'dis';

  // Get args after command
  const args = content.replace(rollRegex, '').trim().split(/\s+/);

  let rollInput = '1d20'; // default

  // Handle first argument if present
  if (args[0] && /^(\d*)d\d+/.test(args[0])) {
    rollInput = args[0];
  } else if (args[0] && /^[-+]\d+$/.test(args[0])) {
    // If it's just a modifier like +7, treat as 1d20+7
    rollInput = '1d20' + args[0];
  }

  // Handle additional modifier (e.g., '1d20' '+4')
  if (
    args.length > 1 &&
    /^[-+]\d+$/.test(args[1]) &&
    !rollInput.includes('+') &&
    !rollInput.includes('-')
  ) {
    rollInput += args[1];
  }

  // Override or add mode if 'adv' or 'dis' appears as an argument
  if (args.includes('adv')) mode = 'adv';
  if (args.includes('dis')) mode = 'dis';

  const { result, breakdown } = rollDice(rollInput, mode);

message.channel.send({
  content: `🎲 **${message.member?.displayName || message.author.username}** rolled \`${rollInput}${mode ? ' ' + mode : ''}\`:\n${breakdown}**Total: ${result}**`,
});
});

function rollDice(input, mode) {
  const match = input.match(/^(\d*)d(\d+)([+-]?\d+)?$/);
  if (!match) return { result: 0, breakdown: '❌ Invalid roll format.\n' };

  let [_, numDice, sides, modifier] = match;
  numDice = parseInt(numDice) || 1;
  sides = parseInt(sides);
  modifier = parseInt(modifier) || 0;

  let rolls = [];

  if ((mode === 'adv' || mode === 'dis') && numDice === 1) {
    const first = Math.floor(Math.random() * sides) + 1;
    const second = Math.floor(Math.random() * sides) + 1;
    rolls = [first, second];
    const chosen = mode === 'adv' ? Math.max(first, second) : Math.min(first, second);
    const result = chosen + modifier;

    return {
      result,
      breakdown: `Rolls: [${first}, ${second}] → ${mode === 'adv' ? 'Highest' : 'Lowest'}: ${chosen}\nModifier: ${modifier >= 0 ? '+' : ''}${modifier}\n`,
    };
  }

  for (let i = 0; i < numDice; i++) {
    rolls.push(Math.floor(Math.random() * sides) + 1);
  }

  const total = rolls.reduce((a, b) => a + b, 0) + modifier;

  return {
    result: total,
    breakdown: `Rolls: [${rolls.join(', ')}]\nModifier: ${modifier >= 0 ? '+' : ''}${modifier}\n`,
  };
}

client.login(process.env.DISCORD_TOKEN);
