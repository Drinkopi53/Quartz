export default async function main(bot, skills, world) {
    bot.chat("Halo! Memulai eksekusi skrip kustom...");
    
    // Dapatkan posisi bot
    const pos = bot.entity.position;
    bot.chat(`Posisi saya sekarang: x=${pos.x.toFixed(1)}, y=${pos.y.toFixed(1)}, z=${pos.z.toFixed(1)}`);
    
    // Equip weapon terbaik
    bot.chat("Menyiapkan senjata terbaik...");
    let weapons = bot.inventory.items().filter(item => item.name.includes('sword') || (item.name.includes('axe') && !item.name.includes('pickaxe')));
    if (weapons.length > 0) {
        weapons.sort((a, b) => b.attackDamage - a.attackDamage);
        await bot.equip(weapons[0], 'hand');
        bot.chat(`Berhasil memakai senjata: ${weapons[0].name}`);
    } else {
        bot.chat("Tidak ada senjata (pedang/kapak) di inventory.");
    }
    
    bot.chat("Skrip kustom selesai dijalankan!");
}
