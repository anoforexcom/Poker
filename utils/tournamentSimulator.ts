// Sistema de simulação de torneios e bots em tempo real
// Este código simula milhares de bots jogando em torneios que começam e terminam automaticamente

import { generateBotName } from './nameGenerator';

export interface SimulatedBot {
    id: string;
    name: string;
    avatar: string;
    balance: number;
    gamesPlayed: number;
    tournamentsWon: number;
    winRate: number;
    skill: number; // 0-100, afeta probabilidade de vitória
}

export type GameType = 'tournament' | 'cash' | 'sitgo' | 'spingo';

export interface SimulatedTournament {
    id: string;
    name: string;
    type: GameType;
    status: 'registering' | 'running' | 'finished';
    buyIn: number;
    prizePool: number;
    players: SimulatedBot[];
    maxPlayers: number;
    startTime: Date;
    endTime?: Date;
    winner?: SimulatedBot;
    currentRound: number;
    blindLevel: number;
}

export class TournamentSimulator {
    private bots: Map<string, SimulatedBot> = new Map();
    private tournaments: Map<string, SimulatedTournament> = new Map();
    private tournamentCounter = 0;
    private botCounter = 0;
    private simulationInterval?: number;
    private tournamentCreationInterval?: number;

    constructor(
        private config = {
            initialBots: 1000, // Número inicial de bots
            maxBots: 10000, // Máximo de bots no sistema
            tournamentInterval: 5 * 60 * 1000, // Criar torneio a cada 5 minutos
            simulationSpeed: 1000, // Atualizar simulação a cada 1 segundo
            maxConcurrentTournaments: 50, // Máximo de torneios simultâneos
        }
    ) {
        this.initializeBots();
    }

    // Inicializar bots
    private initializeBots() {
        for (let i = 0; i < this.config.initialBots; i++) {
            this.createBot();
        }
    }

    // Criar um novo bot
    private createBot(): SimulatedBot {
        const id = `bot_${this.botCounter++}`;
        const bot: SimulatedBot = {
            id,
            name: generateBotName(),
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
            balance: 1000 + Math.random() * 9000, // $1k - $10k
            gamesPlayed: Math.floor(Math.random() * 1000),
            tournamentsWon: Math.floor(Math.random() * 50),
            winRate: 0.3 + Math.random() * 0.4, // 30% - 70%
            skill: Math.floor(Math.random() * 100), // 0-100
        };
        this.bots.set(id, bot);
        return bot;
    }

    // Criar um novo torneio
    private createTournament(forcedType?: GameType): SimulatedTournament {
        const id = `tournament_${this.tournamentCounter++}`;
        const types: GameType[] = ['tournament', 'cash', 'sitgo', 'spingo'];
        const type = forcedType || types[Math.floor(Math.random() * types.length)];

        let buyIn = [10, 25, 50, 100, 250, 500, 1000][Math.floor(Math.random() * 7)];
        let maxPlayers = [9, 18, 27, 45, 90, 180][Math.floor(Math.random() * 6)];
        let name = this.generateTournamentName(type);
        let status: 'registering' | 'running' | 'finished' = 'registering';

        if (type === 'cash') {
            maxPlayers = 6;
            status = 'running';
            buyIn = [1, 2, 5, 10, 25, 50][Math.floor(Math.random() * 6)]; // Blinds usually
        } else if (type === 'spingo') {
            maxPlayers = 3;
            buyIn = [1, 5, 10, 25, 50, 100][Math.floor(Math.random() * 6)];
        } else if (type === 'sitgo') {
            maxPlayers = [2, 6, 9][Math.floor(Math.random() * 3)];
        }

        const tournament: SimulatedTournament = {
            id,
            name,
            type,
            status,
            buyIn,
            prizePool: 0,
            players: [],
            maxPlayers,
            startTime: status === 'running' ? new Date() : new Date(Date.now() + 2 * 60 * 1000),
            currentRound: 0,
            blindLevel: 1,
        };

        this.tournaments.set(id, tournament);
        this.registerBotsForTournament(tournament);
        return tournament;
    }

    // Gerar nome de torneio
    private generateTournamentName(type: GameType): string {
        if (type === 'cash') {
            const places = ['Las Vegas', 'Macau', 'Monaco', 'London', 'Atlantic City', 'Tokyo'];
            const stakes = ['Low Stakes', 'Mid Stakes', 'High Stakes', 'Nosebleed'];
            return `${places[Math.floor(Math.random() * places.length)]} ${stakes[Math.floor(Math.random() * stakes.length)]}`;
        }
        if (type === 'spingo') return `Spin & Go $${Math.random() > 0.9 ? '1M' : 'Jackpot'}`;
        if (type === 'sitgo') return `Sit & Go ${[2, 6, 9][Math.floor(Math.random() * 3)]} Players`;

        const prefixes = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const types = ['Million', 'Showdown', 'Championship', 'Masters', 'Classic', 'Turbo', 'Bounty'];
        const times = ['Morning', 'Afternoon', 'Evening', 'Night', 'Late Night'];

        const day = prefixes[Math.floor(Math.random() * prefixes.length)];
        const genre = types[Math.floor(Math.random() * types.length)];
        const time = times[Math.floor(Math.random() * times.length)];

        return `${day} ${time} ${genre}`;
    }

    // Registrar bots em um torneio
    private registerBotsForTournament(tournament: SimulatedTournament) {
        // Preencher entre 60% e 100% dos slots
        const targetPlayers = Math.floor(
            tournament.maxPlayers * (0.6 + Math.random() * 0.4)
        );

        const availableBots = Array.from(this.bots.values()).filter(
            bot => bot.balance >= tournament.buyIn
        );

        // Embaralhar e pegar os primeiros N bots
        const shuffled = availableBots.sort(() => Math.random() - 0.5);
        const selectedBots = shuffled.slice(0, targetPlayers);

        tournament.players = selectedBots;
        tournament.prizePool = tournament.buyIn * selectedBots.length;
    }

    // Simular um torneio
    private simulateTournament(tournament: SimulatedTournament) {
        // Start registering tournaments when time or full (for Sit&Go/SpinGo)
        const isSitGo = tournament.type === 'sitgo' || tournament.type === 'spingo';

        if (tournament.status === 'registering') {
            const shouldStart = isSitGo
                ? tournament.players.length === tournament.maxPlayers
                : new Date() >= tournament.startTime;

            if (shouldStart) {
                tournament.status = 'running';
                if (tournament.type === 'spingo') {
                    // Random Multiplier for Spin & Go
                    const rolls = [2, 2, 2, 4, 6, 10, 25, 100, 1000];
                    const multiplier = rolls[Math.floor(Math.random() * rolls.length)];
                    tournament.prizePool = tournament.buyIn * multiplier;
                }
            }
        }

        if (tournament.status === 'running') {
            // Simular eliminações
            if (tournament.players.length > 1) {
                // Aumentar blind level a cada 10 rounds
                if (tournament.currentRound % 10 === 0) {
                    tournament.blindLevel++;
                }

                // Eliminar jogadores baseado em skill
                const playersToEliminate = Math.max(1, Math.floor(tournament.players.length * 0.1));

                // Ordenar por skill (menor skill = maior chance de eliminação)
                const sorted = [...tournament.players].sort((a, b) => a.skill - b.skill);
                const eliminated = sorted.slice(0, playersToEliminate);

                tournament.players = tournament.players.filter(
                    p => !eliminated.includes(p)
                );

                tournament.currentRound++;
            }

            // Torneio terminou
            if (tournament.players.length === 1) {
                tournament.status = 'finished';
                tournament.winner = tournament.players[0];
                tournament.endTime = new Date();

                // Atualizar estatísticas do vencedor
                if (tournament.winner) {
                    tournament.winner.balance += tournament.prizePool * 0.3; // 30% do prize pool
                    tournament.winner.tournamentsWon++;
                }

                try {
                    console.log(`🏆 Torneio ${tournament.name} terminou! Vencedor: ${tournament.winner?.name}`);
                } catch (e) {
                    // Ignore console errors in production
                }

                // Remover torneio após 5 minutos
                setTimeout(() => {
                    this.tournaments.delete(tournament.id);
                }, 5 * 60 * 1000);
            }
        }
    }

    // Iniciar simulação
    start() {
        try {
            console.log('🚀 Iniciando simulador de torneios...');
            console.log(`📊 ${this.bots.size} bots inicializados`);
        } catch (e) {
            // Ignore console errors in production
        }

        // Criar torneios periodicamente
        this.tournamentCreationInterval = setInterval(() => {
            const activeTournaments = Array.from(this.tournaments.values()).filter(
                t => t.status !== 'finished'
            ).length;

            if (activeTournaments < this.config.maxConcurrentTournaments) {
                this.createTournament();
                try {
                    console.log(`✨ Novo torneio criado! Total ativo: ${activeTournaments + 1}`);
                } catch (e) {
                    // Ignore console errors in production
                }
            }

            // Criar mais bots se necessário
            if (this.bots.size < this.config.maxBots) {
                const botsToCreate = Math.min(100, this.config.maxBots - this.bots.size);
                for (let i = 0; i < botsToCreate; i++) {
                    this.createBot();
                }
            }
        }, this.config.tournamentInterval) as unknown as number;

        // Simular torneios
        this.simulationInterval = setInterval(() => {
            this.tournaments.forEach(tournament => {
                this.simulateTournament(tournament);
            });
        }, this.config.simulationSpeed) as unknown as number;

        // Criar alguns torneios iniciais
        for (let i = 0; i < 10; i++) {
            this.createTournament();
        }
    }

    // Parar simulação
    stop() {
        if (this.simulationInterval) clearInterval(this.simulationInterval);
        if (this.tournamentCreationInterval) clearInterval(this.tournamentCreationInterval);
        try {
            console.log('⏹️ Simulador parado');
        } catch (e) {
            // Ignore console errors in production
        }
    }

    // Obter estatísticas
    getStats() {
        const activeTournaments = Array.from(this.tournaments.values()).filter(
            t => t.status !== 'finished'
        );
        const registeringTournaments = activeTournaments.filter(t => t.status === 'registering');
        const runningTournaments = activeTournaments.filter(t => t.status === 'running');
        const finishedTournaments = Array.from(this.tournaments.values()).filter(
            t => t.status === 'finished'
        );

        return {
            totalBots: this.bots.size,
            totalTournaments: this.tournaments.size,
            registeringTournaments: registeringTournaments.length,
            runningTournaments: runningTournaments.length,
            finishedTournaments: finishedTournaments.length,
            totalPlayersInTournaments: activeTournaments.reduce(
                (sum, t) => sum + t.players.length,
                0
            ),
        };
    }

    // Obter todos os torneios
    getTournaments(): SimulatedTournament[] {
        return Array.from(this.tournaments.values());
    }

    // Obter torneios ativos
    getActiveTournaments(): SimulatedTournament[] {
        return Array.from(this.tournaments.values()).filter(
            t => t.status !== 'finished'
        );
    }

    // Obter bots
    getBots(): SimulatedBot[] {
        return Array.from(this.bots.values());
    }

    // Obter top bots por vitórias
    getTopBots(limit = 10): SimulatedBot[] {
        return Array.from(this.bots.values())
            .sort((a, b) => b.tournamentsWon - a.tournamentsWon)
            .slice(0, limit);
    }
}

// Singleton instance
let simulatorInstance: TournamentSimulator | null = null;

export const getTournamentSimulator = (config?: any): TournamentSimulator => {
    if (!simulatorInstance) {
        simulatorInstance = new TournamentSimulator(config);
    }
    return simulatorInstance;
};

export const startGlobalSimulation = (config?: any) => {
    const simulator = getTournamentSimulator(config);
    simulator.start();
    return simulator;
};

export const stopGlobalSimulation = () => {
    if (simulatorInstance) {
        simulatorInstance.stop();
    }
};
