export default async function main(bot, skills, world) {
    bot.chat("Memulai misi mencari 100 Iron Ore!");

    // Tingkatkan limit listener untuk menghindari MaxListenersExceededWarning saat loop panjang
    bot.setMaxListeners(1000);

    // Pause background modes that might interrupt the custom script
    bot.modes.pause('unstuck');
    bot.modes.pause('self_defense');
    bot.modes.pause('cowardice');

    let iron_collected = 0;
    const target_iron = 100;
    const ignored_blocks = []; // Menyimpan posisi blok yang tidak bisa dijangkau agar tidak di-loop

    try {
        while (iron_collected < target_iron && !bot.interrupt_code) {
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
            bot.chat("Ada monster! Menunda pencarian iron untuk bertarung...");
            const fought = await skills.defendSelf(bot, 10);
            if (fought) {
                bot.chat("Monster berhasil dikalahkan! Melanjutkan tugas mencari iron.");
            }
        }

        // 3. Cari block iron ore terdekat
        const iron_blocks = world.getNearestBlocksWhere(bot, block => {
            if (block.name !== 'iron_ore' && block.name !== 'deepslate_iron_ore') return false;
            // Abaikan blok yang ada di daftar ignored_blocks
            for (let bad_pos of ignored_blocks) {
                if (bad_pos.equals(block.position)) return false;
            }
            return true;
        }, 64, 1);

        if (iron_blocks.length === 0) {
            bot.chat("Tidak ada Iron Ore yang bisa dijangkau di sekitar jarak 64 blok. Mengeksplorasi area baru...");
            await skills.moveAway(bot, 32);
            continue;
        }

        // 4. Coba menambang 1 block iron
        try {
            const target_block_name = iron_blocks[0].name;
            const success = await skills.collectBlock(bot, target_block_name, 1);
            if (success) {
                iron_collected++;
                if (iron_collected % 5 === 0 || iron_collected === target_iron) {
                    bot.chat(`Berhasil mengumpulkan ${iron_collected}/${target_iron} Iron.`);
                }
            } else {
                // Jika gagal menambang, kemungkinan stuck (pathfinding error)
                bot.stopDigging();
                ignored_blocks.push(iron_blocks[0].position);
                bot.chat("Gagal menambang blok ini (stuck/terhalang). Mengabaikan blok ini ke depannya dan mencari jalan keluar...");
                const moved = await skills.moveAway(bot, 5);
                if (moved) {
                     bot.chat("Bebas dari stuck! Melanjutkan pencarian.");
                } else {
                     bot.chat("Gagal mencari jalan keluar, saya akan mencoba menambang area lain.");
                }
            }
        } catch (error) {
            bot.stopDigging();
            ignored_blocks.push(iron_blocks[0].position);
            bot.chat("Terjadi error saat mencoba menambang (stuck). Mengabaikan blok ini dan membebaskan diri.");
            await skills.moveAway(bot, 4);
            bot.chat("Melanjutkan pencarian.");
        }

            await skills.wait(bot, 500); // Wait sebentar sebelum loop selanjutnya untuk mengurangi lag
        }

        if (iron_collected >= target_iron) {
            bot.chat("Misi selesai! 100 Iron berhasil dikumpulkan.");
        } else if (!bot.interrupt_code) {
            bot.chat(`Misi berhenti. Hanya berhasil mengumpulkan ${iron_collected}/${target_iron} Iron.`);
        }
    } finally {
        // Unpause background modes when the script ends
        bot.modes.unpause('unstuck');
        bot.modes.unpause('self_defense');
        bot.modes.unpause('cowardice');
    }
}
