export default async function main(bot, skills, world) {
    bot.chat("Memulai misi mencari 60 Diamond Ore!");

    // Pause background modes that might interrupt the custom script
    bot.modes.pause('unstuck');
    bot.modes.pause('self_defense');
    bot.modes.pause('cowardice');

    let diamond_collected = 0;
    const target_diamond = 60;

    try {
        // Menuju kedalaman -50
        while (bot.entity.position.y > -50 && !bot.interrupt_code) {
            let y_diff = Math.floor(bot.entity.position.y - (-50));
            bot.chat(`Posisi terlalu tinggi. Menggali ke bawah sejauh ${y_diff} blok untuk mencapai spot terbaik (Y = -50)...`);
            let dug = await skills.digDown(bot, y_diff);
            if (!dug) {
                bot.chat("Terhalang saat menggali ke bawah (lava/air/jurang). Bergeser mencari spot penggalian lain...");
                await skills.moveAway(bot, 10);
            }
        }

        while (diamond_collected < target_diamond && !bot.interrupt_code) {
        // 1. Cek keberadaan pickaxe
        let has_pickaxe = false;
        const items = bot.inventory.items();
        for (let item of items) {
            if (item.name.includes("pickaxe")) {
                has_pickaxe = true;
                break;
            }
        }

        if (!has_pickaxe) {
            bot.chat("Comrade, Pickaxe saya hancur atau tidak ditemukan.");
            return;
        }

        // 2. Cek dan lawan monster jika ada (Defense mechanism)
        const enemies = world.getNearestEntityWhere(bot, entity => {
            return entity.type === 'mob' && (entity.name === 'zombie' || entity.name === 'skeleton' || entity.name === 'spider' || entity.name === 'creeper' || entity.name === 'enderman' || entity.name === 'husk' || entity.name === 'drowned'); // Simple hostile check
        }, 8);

        if (enemies) {
            bot.chat("Ada monster! Menunda pencarian diamond untuk bertarung...");
            const fought = await skills.defendSelf(bot, 10);
            if (fought) {
                bot.chat("Monster berhasil dikalahkan! Melanjutkan tugas mencari diamond.");
            }
        }

        // 3. Cari block diamond ore terdekat
        const diamond_blocks = world.getNearestBlocksWhere(bot, block => block.name === 'diamond_ore' || block.name === 'deepslate_diamond_ore', 64, 1);

        if (diamond_blocks.length === 0) {
            bot.chat("Tidak ada Diamond Ore di sekitar jarak 64 blok. Mengeksplorasi area baru...");
            await skills.moveAway(bot, 32);
            continue;
        }

        // 4. Coba menambang 1 block diamond
        try {
            const target_block_name = diamond_blocks[0].name;
            const success = await skills.collectBlock(bot, target_block_name, 1);
            if (success) {
                diamond_collected++;
                if (diamond_collected % 5 === 0 || diamond_collected === target_diamond) {
                    bot.chat(`Berhasil mengumpulkan ${diamond_collected}/${target_diamond} Diamond.`);
                }
            } else {
                // Jika gagal menambang, kemungkinan stuck (pathfinding error)
                bot.chat("Sepertinya saya terjebak (stuck). Mencoba mencari jalan keluar...");
                const moved = await skills.moveAway(bot, 5);
                if (moved) {
                     bot.chat("Bebas dari stuck! Melanjutkan penambangan.");
                } else {
                     bot.chat("Gagal mencari jalan keluar, saya akan mencoba menambang area lain.");
                }
            }
        } catch (error) {
            bot.chat("Terjadi error saat mencoba menambang atau stuck. Mencoba membebaskan diri.");
            await skills.moveAway(bot, 4);
            bot.chat("Melanjutkan penambangan.");
        }

            await skills.wait(bot, 500); // Wait sebentar sebelum loop selanjutnya untuk mengurangi lag
        }

        if (diamond_collected >= target_diamond) {
            bot.chat("Misi selesai! 60 Diamond berhasil dikumpulkan.");
        } else if (!bot.interrupt_code) {
            bot.chat(`Misi berhenti. Hanya berhasil mengumpulkan ${diamond_collected}/${target_diamond} Diamond.`);
        }
    } finally {
        // Unpause background modes when the script ends
        bot.modes.unpause('unstuck');
        bot.modes.unpause('self_defense');
        bot.modes.unpause('cowardice');
    }
}
