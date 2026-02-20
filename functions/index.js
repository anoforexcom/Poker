const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { Table } = require("./engine/table");
const { botDecision } = require("./bots");

admin.initializeApp();

exports.pokerGame = onCall(async (request) => {
    const { action, amount, playerId, tableId = "main_table" } = request.data;
    const db = admin.firestore();
    const tableRef = db.collection("tables").doc(tableId);

    // Load table from Firestore
    const tableDoc = await tableRef.get();
    let table = new Table(tableDoc.exists ? tableDoc.data() : null);

    if (action === "start") {
        table = new Table();

        // Fetch human player info if available
        let humanName = "You";
        let humanAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${playerId}`;

        try {
            const profileDoc = await db.collection("profiles").doc(playerId).get();
            if (profileDoc.exists) {
                const profileData = profileDoc.data();
                humanName = profileData.name || humanName;
                humanAvatar = profileData.avatar_url || humanAvatar;
            }
        } catch (e) {
            console.error("Error fetching profile for start:", e);
        }

        table.addPlayer({
            id: playerId,
            name: humanName,
            avatar: humanAvatar,
            stack: 10000,
            isBot: false
        });

        // Add 5 bots
        const botNames = ["Alice", "Bob", "Charlie", "David", "Eve"];
        for (let i = 0; i < 5; i++) {
            const botId = "bot_" + (i + 1);
            table.addPlayer({
                id: botId,
                name: botNames[i],
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${botId}`,
                stack: 10000,
                isBot: true
            });
        }

        table.startHand();
        await tableRef.set(table.toState());
        return { success: true, tableState: table.toState() };
    }

    if (!tableDoc.exists) return { error: "Table not found" };

    const currentPlayer = table.players.find(p => p.id === playerId);
    if (!currentPlayer) return { error: "Player not found" };

    // Process human action
    table.playerAction(currentPlayer, action, amount);

    // Process bots
    processBots(table);

    // Persist and return
    const newState = table.toState();
    await tableRef.set(newState);
    return { success: true, tableState: newState };
});

function processBots(table) {
    table.players.forEach(player => {
        if (player.isBot && !player.hasFolded && !player.isAllIn) {
            const decision = botDecision(player, table);
            if (decision) {
                table.playerAction(player, decision.action, decision.amount);
            }
        }
    });
}

function serializeTable(table) {
    // Convert class to plain object for transport
    return JSON.parse(JSON.stringify(table));
}
