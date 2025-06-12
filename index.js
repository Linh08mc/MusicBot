require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ActivityType, StringSelectMenuBuilder } = require('discord.js');

const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Bot âm nhạc Discord đang chạy!');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Máy chủ Express đang chạy trên cổng ${port}`);
});

const { Manager } = require('erela.js');

const nodes = [{
  name: 'xx',
  host: 'lavalink.serenetia.com',
  port: 443,
  password: 'https://dsc.gg/ajidevserver',
  secure: false,
}];

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

const manager = new Manager({
  nodes,
  send(id, payload) {
    const guild = client.guilds.cache.get(id);
    if (guild) guild.shard.send(payload);
  },
  defaultSearchPlatform: 'youtube',
  autoPlay: true,
  clientName: `${client.user?.username || 'Music Bot'}`,
  plugins: []
});

const commands = [
  new SlashCommandBuilder()
    .setName('play')
    .setDescription('Phát một bài hát')
    .addStringOption(option => 
      option.setName('query')
        .setDescription('Tên bài hát hoặc URL')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Tạm dừng bài hát hiện tại'),
  new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Tiếp tục bài hát hiện tại'),
  new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Chuyển sang bài hát tiếp theo'),
  new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Hiển thị danh sách phát hiện tại'),
  new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Hiển thị bài hát đang phát'),
  new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Xáo trộn danh sách phát'),
  new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Bật/tắt chế độ lặp')
    .addStringOption(option =>
      option.setName('mode')
        .setDescription('Chế độ lặp')
        .setRequired(true)
        .addChoices(
          { name: 'Tắt', value: 'off' },
          { name: 'Bài hát', value: 'track' },
          { name: 'Danh sách', value: 'queue' }
        )),
  new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Xóa một bài hát khỏi danh sách phát')
    .addIntegerOption(option =>
      option.setName('position')
        .setDescription('Vị trí trong danh sách')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('move')
    .setDescription('Di chuyển bài hát đến vị trí khác')
    .addIntegerOption(option =>
      option.setName('from')
        .setDescription('Vị trí ban đầu')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('to')
        .setDescription('Vị trí mới')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('clearqueue')
    .setDescription('Xóa toàn bộ danh sách phát'),
  new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Dừng nhạc và thoát'),
  new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Điều chỉnh âm lượng')
    .addIntegerOption(option =>
      option.setName('level')
        .setDescription('Mức âm lượng (0-100)')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('247')
    .setDescription('Bật/tắt chế độ 24/7'),
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Hiển thị tất cả lệnh'),
  new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Lấy liên kết mời bot'),
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Hiển thị độ trễ của bot'),
  new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Hiển thị thống kê của bot'),
  new SlashCommandBuilder()
    .setName('support')
    .setDescription('Tham gia máy chủ hỗ trợ'),

].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

client.once('ready', async () => {
  console.log(`Đã đăng nhập với tên ${client.user.tag}`);
  manager.init(client.user.id);

  client.user.setActivity('/help | @Nutifood', { type: ActivityType.Listening });

  try {
    console.log('Đang làm mới lệnh slash...');
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('Lệnh slash đã được đăng ký.');
  } catch (error) {
    console.error(error);
  }
});

client.on('raw', (data) => manager.updateVoiceState(data));

function createMusicEmbed(track) {
  return new EmbedBuilder()
    .setTitle('🎵 Đang phát')
    .setDescription(`[${track.title}](${track.uri})`)
    .addFields(
      { name: '👤 Nghệ sĩ', value: track.author, inline: true },
      { name: '⏱️ Thời lượng', value: formatDuration(track.duration), inline: true }
    )
    .setThumbnail(track.thumbnail)
    .setColor('#FF0000');
}

function formatDuration(duration) {
  const minutes = Math.floor(duration / 60000);
  const seconds = ((duration % 60000) / 1000).toFixed(0);
  return `${minutes}:${seconds.padStart(2, '0')}`;
}

function createControlButtons() {
  return [
    new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('pause')
          .setLabel('Tạm dừng/Tiếp tục')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('skip')
          .setLabel('Bỏ qua')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('stop')
          .setLabel('Dừng')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('loop')
          .setLabel('Lặp')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('queue')
          .setLabel('Danh sách')
          .setStyle(ButtonStyle.Secondary)
      )
  ];
}

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand() && !interaction.isButton() && !interaction.isStringSelectMenu()) return;

  if (interaction.isButton()) {
    if (!interaction.member.voice.channel) {
      return interaction.reply({ content: 'Bạn cần tham gia kênh thoại để sử dụng các nút!', ephemeral: true });
    }
    const player = manager.players.get(interaction.guild.id);
    if (!player) return;

    const currentTrack = player.queue.current;
    if (!currentTrack) return;

    if (currentTrack.requester.id !== interaction.user.id) {
      return interaction.reply({ content: 'Chỉ người yêu cầu bài hát này mới có thể sử dụng các nút này!', ephemeral: true });
    }

    switch (interaction.customId) {
      case 'pause':
        player.pause(!player.paused);
        await interaction.reply({ content: player.paused ? 'Đã tạm dừng' : 'Đã tiếp tục', ephemeral: true });
        break;
      case 'skip':
        const skipMessage = player.get('currentMessage');
        if (skipMessage && skipMessage.editable) {
          const disabledButtons = skipMessage.components[0].components.map(button => {
            return ButtonBuilder.from(button).setDisabled(true);
          });
          skipMessage.edit({ components: [new ActionRowBuilder().addComponents(disabledButtons)] });
        }
        if (player.queue.length === 0) {
          const queueEndEmbed = new EmbedBuilder()
            .setDescription('Danh sách phát đã kết thúc!')
            .setColor('#FF0000')
            .setTimestamp();
          await interaction.channel.send({ embeds: [queueEndEmbed] });
          player.set('manualStop', true);
        }
        player.stop();
        await interaction.reply({ content: 'Đã bỏ qua', ephemeral: true });
        break;
      case 'stop':
        const stopMessage = player.get('currentMessage');
        if (stopMessage && stopMessage.editable) {
          const disabledButtons = stopMessage.components[0].components.map(button => {
            return ButtonBuilder.from(button).setDisabled(true);
          });
          stopMessage.edit({ components: [new ActionRowBuilder().addComponents(disabledButtons)] });
        }
        player.set('manualStop', true);
        const stopEmbed = new EmbedBuilder()
          .setDescription('Danh sách phát đã kết thúc!')
          .setColor('#FF0000')
          .setTimestamp();
        await interaction.channel.send({ embeds: [stopEmbed] });
        player.destroy();
        await interaction.reply({ content: 'Đã dừng', ephemeral: true });
        break;
      case 'loop':
        player.setQueueRepeat(!player.queueRepeat);
        await interaction.reply({ content: `Lặp: ${player.queueRepeat ? 'Đã bật' : 'Đã tắt'}`, ephemeral: true });
        break;
      case 'queue':
        const queue = player.queue;
        const currentTrack = player.queue.current;
        let description = queue.length > 0 ? queue.map((track, i) => 
          `${i + 1}. [${track.title}](${track.uri})`).join('\n') : 'Không có bài hát trong danh sách';

        if (currentTrack) description = `**Đang phát:**\n[${currentTrack.title}](${currentTrack.uri})\n\n**Danh sách:**\n${description}`;

        const embed = new EmbedBuilder()
          .setTitle('Danh sách phát')
          .setDescription(description)
          .setColor('#FF0000')
          .setTimestamp();
        await interaction.reply({ embeds: [embed], ephemeral: true });
        break;
    }
    return;
  }

  if (interaction.isStringSelectMenu() && interaction.customId === 'filter') {
    const player = manager.players.get(interaction.guild.id);
    if (!player) return;

    const filter = interaction.values[0];
    player.node.send({
      op: 'filters',
      guildId: interaction.guild.id,
      [filter]: true
    });

    const embed = new EmbedBuilder()
      .setDescription(`🎵 Đã áp dụng bộ lọc: ${filters[filter]}`)
      .setColor('#FF0000')
      .setFooter({ 
        text: `Yêu cầu bởi ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
    return;
  }

  const { commandName, options } = interaction;

  if (commandName === 'play') {
    if (!interaction.member.voice.channel) {
      return interaction.reply({ content: 'Hãy tham gia kênh thoại trước!', ephemeral: true });
    }

    const player = manager.create({
      guild: interaction.guild.id,
      voiceChannel: interaction.member.voice.channel.id,
      textChannel: interaction.channel.id,
      selfDeafen: true
    });

    if (!player.twentyFourSeven) player.twentyFourSeven = false;

    player.connect();

    const query = options.getString('query');
    const res = await manager.search(query, interaction.user);

    switch (res.loadType) {
      case 'TRACK_LOADED':
      case 'SEARCH_RESULT':
        if (!res.tracks || res.tracks.length === 0) {
          await interaction.reply({ content: 'Không tìm thấy kết quả! Vui lòng thử từ khóa tìm kiếm khác.', ephemeral: true });
          return;
        }
        const track = res.tracks[0];
        player.queue.add(track);
        const embed = new EmbedBuilder()
          .setDescription(`Đã thêm [${track.title}](${track.uri}) vào danh sách phát`)
          .setColor('#FF0000')
          .setFooter({ 
            text: `Yêu cầu bởi ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL()
          })
          .setTimestamp();
        await interaction.reply({ embeds: [embed] });
        if (!player.playing && !player.paused) player.play();
        break;
      case 'NO_MATCHES':
        await interaction.reply({ content: 'Không tìm thấy kết quả! Vui lòng thử từ khóa tìm kiếm khác.', ephemeral: true });
        break;
      case 'LOAD_FAILED':
        await interaction.reply({ content: 'Không thể tải bài hát! Vui lòng thử lại hoặc sử dụng liên kết khác.', ephemeral: true });
        break;
    }
  }

  if (commandName === 'pause') {
    const player = manager.players.get(interaction.guild.id);
    if (!player) return interaction.reply({ content: 'Không có bài hát nào đang phát!', ephemeral: true });

    player.pause(true);
    const embed = new EmbedBuilder()
      .setDescription('⏸️ Đã tạm dừng')
      .setColor('#FF0000')
      .setFooter({ text: `Yêu cầu bởi ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  }

  if (commandName === 'resume') {
    const player = manager.players.get(interaction.guild.id);
    if (!player) return interaction.reply({ content: 'Không có bài hát nào đang phát!', ephemeral: true });

    player.pause(false);
    const embed = new EmbedBuilder()
      .setDescription('▶️ Đã tiếp tục')
      .setColor('#FF0000')
      .setFooter({ text: `Yêu cầu bởi ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  }

  if (commandName === 'skip') {
    const player = manager.players.get(interaction.guild.id);
    if (!player) return interaction.reply({ content: 'Không có bài hát nào đang phát!', ephemeral: true });

    player.stop();
    const embed = new EmbedBuilder()
      .setDescription('⏭️ Đã bỏ qua')
      .setColor('#FF0000')
      .setFooter({ text: `Yêu cầu bởi ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  }

  if (commandName === 'queue') {
    const player = manager.players.get(interaction.guild.id);
    if (!player) return interaction.reply({ content: 'Không có bài hát nào đang phát!', ephemeral: true });

    const queue = player.queue;
    const currentTrack = player.queue.current;
    let description = queue.length > 0 ? queue.map((track, i) => 
      `${i + 1}. [${track.title}](${track.uri})`).join('\n') : 'Không có bài hát trong danh sách';

    if (currentTrack) description = `**Đang phát:**\n[${currentTrack.title}](${currentTrack.uri})\n\n**Danh sách:**\n${description}`;

    const embed = new EmbedBuilder()
      .setTitle('🎵 Danh sách phát')
      .setDescription(description)
      .setColor('#FF0000')
      .setFooter({ text: `Yêu cầu bởi ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  }

  if (commandName === 'nowplaying') {
    const player = manager.players.get(interaction.guild.id);
    if (!player) return interaction.reply({ content: 'Không có bài hát nào đang phát!', ephemeral: true });

    const track = player.queue.current;
    if (!track) return interaction.reply({ content: 'Không có bài hát nào đang phát!', ephemeral: true });

    const embed = createMusicEmbed(track);
    await interaction.reply({ embeds: [embed] });
  }

  if (commandName === 'shuffle') {
    const player = manager.players.get(interaction.guild.id);
    if (!player) return interaction.reply({ content: 'Không có bài hát nào đang phát!', ephemeral: true });

    player.queue.shuffle();
    const embed = new EmbedBuilder()
      .setDescription('🔀 Đã xáo trộn danh sách phát')
      .setColor('#FF0000')
      .setFooter({ text: `Yêu cầu bởi ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  }

  if (commandName === 'loop') {
    const player = manager.players.get(interaction.guild.id);
    if (!player) return interaction.reply({ content: 'Không có bài hát nào đang phát!', ephemeral: true });

    const mode = options.getString('mode');
    switch (mode) {
      case 'off':
        player.setQueueRepeat(false);
        player.setTrackRepeat(false);
        break;
      case 'track':
        player.setQueueRepeat(false);
        player.setTrackRepeat(true);
        break;
      case 'queue':
        player.setQueueRepeat(true);
        player.setTrackRepeat(false);
        break;
    }

    const embed = new EmbedBuilder()
      .setDescription(`🔄 Chế độ lặp đã được đặt thành: ${mode}`)
      .setColor('#FF0000')
      .setFooter({ text: `Yêu cầu bởi ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  }

  if (commandName === 'remove') {
    const player = manager.players.get(interaction.guild.id);
    if (!player) return interaction.reply({ content: 'Không có bài hát nào đang phát!', ephemeral: true });

    const pos = options.getInteger('position') - 1;
    if (pos < 0 || pos >= player.queue.length) {
      return interaction.reply({ content: 'Vị trí không hợp lệ!', ephemeral: true });
    }

    const removed = player.queue.remove(pos);
    const embed = new EmbedBuilder()
      .setDescription(`❌ Đã xóa [${removed.title}](${removed.uri})`)
      .setColor('#FF0000')
      .setFooter({ text: `Yêu cầu bởi ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  }

  if (commandName === 'move') {
    const player = manager.players.get(interaction.guild.id);
    if (!player) return interaction.reply({ content: 'Không có bài hát nào đang phát!', ephemeral: true });

    const from = options.getInteger('from') - 1;
    const to = options.getInteger('to') - 1;

    if (from < 0 || from >= player.queue.length || to < 0 || to >= player.queue.length) {
      return interaction.reply({ content: 'Vị trí không hợp lệ!', ephemeral: true });
    }

    const track = player.queue[from];
    player.queue.remove(from);
    player.queue.add(track, to);

    const embed = new EmbedBuilder()
      .setDescription(`📦 Đã di chuyển [${track.title}](${track.uri}) đến vị trí ${to + 1}`)
      .setColor('#FF0000')
      .setFooter({ text: `Yêu cầu bởi ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  }

  if (commandName === 'clearqueue') {
    const player = manager.players.get(interaction.guild.id);
    if (!player) return interaction.reply({ content: 'Không có bài hát nào đang phát!', ephemeral: true });

    player.queue.clear();
    const embed = new EmbedBuilder()
      .setDescription('🗑️ Đã xóa toàn bộ danh sách phát')
      .setColor('#FF0000')
      .setFooter({ text: `Yêu cầu bởi ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  }

  if (commandName === 'stop') {
    const player = manager.players.get(interaction.guild.id);
    if (player) {
      player.set('manualStop', true);
      const stopMessage = player.get('currentMessage');
      if (stopMessage && stopMessage.editable) {
        const disabledButtons = stopMessage.components[0].components.map(button => {
          return ButtonBuilder.from(button).setDisabled(true);
        });
        stopMessage.edit({ components: [new ActionRowBuilder().addComponents(disabledButtons)] });
      }
      const stopEmbed = new EmbedBuilder()
        .setDescription('Danh sách phát đã kết thúc!')
        .setColor('#FF0000')
        .setTimestamp();
      await interaction.channel.send({ embeds: [stopEmbed] });
      player.destroy();
      await interaction.reply({ content: '⏹️ Đã dừng nhạc và thoát', ephemeral: true });
    } else {
      await interaction.reply({ content: 'Không có bài hát nào đang phát!', ephemeral: true });
    }
  }

  if (commandName === 'volume') {
    const player = manager.players.get(interaction.guild.id);
    if (!player) return interaction.reply({ content: 'Không có bài hát nào đang phát!', ephemeral: true });

    const volume = options.getInteger('level');
    if (volume < 0 || volume > 100) {
      return interaction.reply({ content: 'Âm lượng phải từ 0 đến 100!', ephemeral: true });
    }

    player.setVolume(volume);
    await interaction.reply(`🔊 Âm lượng đã được đặt thành ${volume}%`);
  }

  if (commandName === '247') {
    const player = manager.players.get(interaction.guild.id);
    if (!player) return interaction.reply({ content: 'Không có nhạc đang phát!', ephemeral: true });

    player.twentyFourSeven = !player.twentyFourSeven;
    const embed = new EmbedBuilder()
      .setDescription(`🎵 Chế độ 24/7 hiện đã ${player.twentyFourSeven ? 'bật' : 'tắt'}`)
      .setColor('#FF0000')
      .setFooter({ 
        text: `Yêu cầu bởi ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }

  if (commandName === 'help') {
    const embed = new EmbedBuilder()
      .setTitle(`🎵 Lệnh của ${client.user.username}`)
      .setDescription('Người bạn đồng hành âm nhạc với chất lượng phát cao!')
      .addFields(
        { name: '🎵 Điều khiển âm nhạc', value: 
          '`/play` - Phát bài hát từ tên/URL\n' +
          '`/pause` - ⏸️ Tạm dừng phát\n' +
          '`/resume` - ▶️ Tiếp tục phát\n' +
          '`/stop` - ⏹️ Dừng và thoát\n' +
          '`/skip` - ⏭️ Bỏ qua bài hiện tại\n' +
          '`/volume` - 🔊 Điều chỉnh âm lượng (0-100)'
        },
        { name: '📑 Quản lý danh sách', value: 
          '`/queue` - 📜 Xem danh sách phát\n' +
          '`/nowplaying` - 🎵 Xem bài đang phát\n' +
          '`/shuffle` - 🔀 Xáo trộn danh sách\n' +
          '`/loop` - 🔁 Đặt chế độ lặp\n' +
          '`/remove` - ❌ Xóa bài hát\n' +
          '`/move` - ↕️ Di chuyển vị trí bài hát'
        },
        { name: '⚙️ Tiện ích', value: 
          '`/247` - 🔄 Bật/tắt chế độ 24/7\n' +
          '`/ping` - 📡 Kiểm tra độ trễ\n' +
          '`/stats` - 📊 Xem thống kê\n' +
          '`/invite` - 📨 Mời bot vào máy chủ\n' +
          '`/support` - 💬 Tham gia máy chủ hỗ trợ'
        }
      )
      .setColor('#FF0000')
      .setThumbnail(client.user.displayAvatarURL())
      .setFooter({ 
        text: `Tạo bởi NhatDuck • Yêu cầu bởi ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTimestamp();
    return await interaction.reply({ embeds: [embed] });
  }

  if (commandName === 'invite') {
    const embed = new EmbedBuilder()
      .setTitle('📨 Mời tôi')
      .setDescription(`[Nhấp vào đây để mời tôi vào máy chủ của bạn](https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands)`)
      .setColor('#FF0000')
      .setFooter({ 
        text: `Yêu cầu bởi ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  }

  if (commandName === 'ping') {
    const ping = Math.round(client.ws.ping);
    const embed = new EmbedBuilder()
      .setTitle('🏓 Pong!')
      .setDescription(`Độ trễ WebSocket: ${ping}ms`)
      .setColor('#FF0000')
      .setFooter({ 
        text: `Yêu cầu bởi ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  }

  if (commandName === 'stats') {
    const uptime = Math.round(client.uptime / 1000);
    const seconds = uptime % 60;
    const minutes = Math.floor((uptime % 3600) / 60);
    const hours = Math.floor((uptime % 86400) / 3600);
    const days = Math.floor(uptime / 86400);

    const embed = new EmbedBuilder()
      .setTitle('📊 Thống kê bot')
      .addFields(
        { name: '⌚ Thời gian hoạt động', value: `${days}d ${hours}h ${minutes}m ${seconds}s`, inline: true },
        { name: '🎵 Người chơi đang hoạt động', value: `${manager.players.size}`, inline: true },
        { name: '🌐 Máy chủ', value: `${client.guilds.cache.size}`, inline: true },
        { name: '👥 Người dùng', value: `${client.users.cache.size}`, inline: true },
        { name: '📡 Ping', value: `${Math.round(client.ws.ping)}ms`, inline: true }
      )
       .setColor('#FF0000')
      .setFooter({ 
        text: `Yêu cầu bởi ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  }

  if (commandName === 'support') {
    const embed = new EmbedBuilder()
      .setTitle('💬 Máy chủ hỗ trợ')
      .setDescription(`[Nhấp vào đây để tham gia máy chủ hỗ trợ của chúng tôi](${process.env.SUPPORT_SERVER})`)
      .setColor('#FF0000')
      .setFooter({ 
        text: `Yêu cầu bởi ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  }
});

manager.on('nodeConnect', (node) => {
  console.log(`Node ${node.options.identifier} đã kết nối`);
});

manager.on('nodeError', (node, error) => {
  console.error(`Lỗi node ${node.options.identifier}:`, error.message);
});

manager.on('trackStart', (player, track) => {
  const channel = client.channels.cache.get(player.textChannel);
  if (channel) {
    const embed = createMusicEmbed(track);
    const buttons = createControlButtons();
    channel.send({ embeds: [embed], components: buttons }).then(msg => {
      player.set('currentMessage', msg);
    });
  }
});

manager.on('queueEnd', (player) => {
  if (player.get('manualStop')) return;

  const channel = client.channels.cache.get(player.textChannel);
  if (channel) {
    const embed = new EmbedBuilder()
      .setDescription('Danh sách phát đã kết thúc!')
      .setColor('#FF0000')
      .setTimestamp();
    channel.send({ embeds: [embed] });

    const message = player.get('currentMessage');
    if (message && message.editable) {
      const disabledButtons = message.components[0].components.map(button => {
        return ButtonBuilder.from(button).setDisabled(true);
      });
      message.edit({ components: [new ActionRowBuilder().addComponents(disabledButtons)] });
    }
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
