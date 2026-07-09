export default async function main(bot, skills, world) {
    bot.chat("Memulai misi mencari 100 Coal Ore!");

    // Pause background modes that might interrupt the custom script
    bot.modes.pause('unstuck');
    bot.modes.pause('self_defense');
    bot.modes.pause('cowardice');

    let coal_collected = 0;
    const target_coal = 100;

    try {
        while (coal_collected < target_coal && !bot.interrupt_code) {
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
            bot.chat("Ada monster! Menunda pencarian coal untuk bertarung...");
            const fought = await skills.defendSelf(bot, 10);
            if (fought) {
                bot.chat("Monster berhasil dikalahkan! Melanjutkan tugas mencari coal.");
            }
        }

        // 3. Cari block coal ore terdekat
        const coal_blocks = world.getNearestBlocksWhere(bot, block => block.name === 'coal_ore' || block.name === 'deepslate_coal_ore', 64, 1);

        if (coal_blocks.length === 0) {
            bot.chat("Tidak ada Coal Ore di sekitar jarak 64 blok. Mengeksplorasi area baru...");
            await skills.moveAway(bot, 32);
            continue;
        }

        // 4. Coba menambang 1 block coal
        try {
            const target_block_name = coal_blocks[0].name;
            const success = await skills.collectBlock(bot, target_block_name, 1);
            if (success) {
                coal_collected++;
                if (coal_collected % 5 === 0 || coal_collected === target_coal) {
                    bot.chat(`Berhasil mengumpulkan ${coal_collected}/${target_coal} Coal.`);
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

        if (coal_collected >= target_coal) {
            bot.chat("Misi selesai! 100 Coal berhasil dikumpulkan.");
        } else if (!bot.interrupt_code) {
            bot.chat(`Misi berhenti. Hanya berhasil mengumpulkan ${coal_collected}/${target_coal} Coal.`);
        }
    } finally {
        // Unpause background modes when the script ends
        bot.modes.unpause('unstuck');
        bot.modes.unpause('self_defense');
        bot.modes.unpause('cowardice');
    }
}
