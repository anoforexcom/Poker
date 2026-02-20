const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { Table } = require("./engine/table");
const { botDecision } = require("./engine/bots");

admin.initializeApp();

exports.pokerGame = onCall(async (request) => {
    const { action, amount, playerId, tableId = "main_table" } = request.data;
    console.log(`[POKER_FUNCTIONS] Action: ${action}, Player: ${playerId}, Table: ${tableId}`);

    const db = admin.firestore();
    const tableRef = db.collection("tables").doc(tableId);

    // Load table from Firestore
    const tableDoc = await tableRef.get();
    let table = new Table(tableDoc.exists ? tableDoc.data() : null);

    if (action === "start") {
        console.log(`[POKER_FUNCTIONS] Starting new table: ${tableId}`);
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
                console.log(`[POKER_FUNCTIONS] Fetched human profile: ${humanName}`);
            }
        } catch (e) {
            console.warn("[POKER_FUNCTIONS] Profile fetch error:", e.message);
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
        console.log(`[POKER_FUNCTIONS] Hand started. Phase: ${table.phase}`);

        const state = table.toState();
        await tableRef.set(state);
        console.log(`[POKER_FUNCTIONS] State persisted to Firestore`);
        return { success: true, tableState: state };
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
    let loopLimit = 10; // Safety break
    while (loopLimit > 0) {
        if (table.phase === "waiting" || table.phase === "showdown") break;

        const activeIdx = table.activePlayerIndex;
        if (activeIdx < 0 || activeIdx >= table.players.length) break;

        const currentPlayer = table.players[activeIdx];
        if (!currentPlayer.isBot) {
            console.log(`[POKER_FUNCTIONS] Waiting for human player: ${currentPlayer.id}`);
            break;
        }

        console.log(`[POKER_FUNCTIONS] Processing bot action for: ${currentPlayer.name}`);
        const decision = botDecision(currentPlayer, table);
        if (decision) {
            console.log(`[POKER_FUNCTIONS] Bot ${currentPlayer.name} decided: ${decision.action}`);
            table.playerAction(currentPlayer, decision.action, decision.amount);
        } else {
            console.warn(`[POKER_FUNCTIONS] Bot ${currentPlayer.name} failed to make a decision!`);
            table.playerAction(currentPlayer, "fold"); // Fallback
        }

        loopLimit--;
    }
}

function serializeTable(table) {
    // Convert class to plain object for transport
    return JSON.parse(JSON.stringify(table));
}
