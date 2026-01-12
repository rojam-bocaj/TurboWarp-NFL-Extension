(function (Scratch) {
    'use strict';

    // Shared global variables accessible by Extension 2
    if (!Scratch.vm.runtime.nflShared) {
        Scratch.vm.runtime.nflShared = {
            SCOREBOARD: null,
            SUMMARY: null
        };
    }

    class NFLExtension1 {
        getInfo() {
            return {
                id: 'nflExtension1',
                name: 'NFL EXTENSION 1',
                blocks: [
                    // -------- SCOREBOARD FETCH --------
                    {
                        opcode: 'fetchScoreboard',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'fetch NFL scoreboard for date [DATE]',
                        arguments: {
                            DATE: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: '20260111'
                            }
                        }
                    },
                    {
                        opcode: 'getMatchups',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'game matchups'
                    },
                    {
                        opcode: 'getScores',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'game scores'
                    },
                    {
                        opcode: 'getStates',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'game states'
                    },
                    {
                        opcode: 'getKickoffTimes',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'kickoff times'
                    },
                    {
                        opcode: 'getEventIDs',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'event IDs'
                    },

                    // -------- SUMMARY FETCH --------
                    {
                        opcode: 'fetchSummary',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'fetch NFL game summary for event ID [EVENT]',
                        arguments: {
                            EVENT: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: '401547405'
                            }
                        }
                    },

                    // -------- BASIC GAME STATE --------
                    {
                        opcode: 'getGameQuarter',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'game quarter'
                    },
                    {
                        opcode: 'getGameClock',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'game clock'
                    },
                    {
                        opcode: 'getGameStatus',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'game status'
                    }
                ]
            };
        }

        // ========== FETCHERS ==========

        async fetchScoreboard(args) {
            const date = String(args.DATE).trim();
            const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${date}`;

            try {
                const response = await fetch(url);
                const json = await response.json();
                Scratch.vm.runtime.nflShared.SCOREBOARD = json;
            } catch (e) {
                Scratch.vm.runtime.nflShared.SCOREBOARD = null;
            }
        }

        async fetchSummary(args) {
            const eventId = String(args.EVENT).trim();
            const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${eventId}`;

            try {
                const response = await fetch(url);
                const json = await response.json();
                Scratch.vm.runtime.nflShared.SUMMARY = json;
            } catch (e) {
                Scratch.vm.runtime.nflShared.SUMMARY = null;
            }
        }

        // ========== SAFE ACCESS HELPERS ==========

        get scoreboard() {
            return Scratch.vm.runtime.nflShared.SCOREBOARD || {};
        }

        get summary() {
            return Scratch.vm.runtime.nflShared.SUMMARY || {};
        }

        safeScoreboardEvents() {
            const ev = this.scoreboard.events;
            return Array.isArray(ev) ? ev : [];
        }

        // ========== SCOREBOARD REPORTERS ==========

        getMatchups() {
            return this.safeScoreboardEvents().map(e => {
                try {
                    const comps = e.competitions[0].competitors;
                    const home = comps.find(c => c.homeAway === 'home');
                    const away = comps.find(c => c.homeAway === 'away');
                    return `${away.team.shortDisplayName} @ ${home.team.shortDisplayName}`;
                } catch {
                    return 'Unknown matchup';
                }
            });
        }

        getScores() {
            return this.safeScoreboardEvents().map(e => {
                try {
                    const comps = e.competitions[0].competitors;
                    const home = comps.find(c => c.homeAway === 'home');
                    const away = comps.find(c => c.homeAway === 'away');
                    return `${away.score} - ${home.score}`;
                } catch {
                    return '';
                }
            });
        }

        getStates() {
            return this.safeScoreboardEvents().map(e => {
                try {
                    return e.status.type.state;
                } catch {
                    return '';
                }
            });
        }

        getKickoffTimes() {
            return this.safeScoreboardEvents().map(e => e.date || '');
        }

        getEventIDs() {
            return this.safeScoreboardEvents().map(e => e.id || '');
        }

        // ========== GAME STATE REPORTERS ==========

        getGameQuarter() {
            try {
                const comp = this.summary.header.competitions[0];
                const period = comp.status.period;
                if (period === 1) return '1ST QUARTER';
                if (period === 2) return '2ND QUARTER';
                if (period === 3) return '3RD QUARTER';
                if (period === 4) return '4TH QUARTER';
                return 'OT';
            } catch {
                return '';
            }
        }

        getGameClock() {
            try {
                const comp = this.summary.header.competitions[0];
                return comp.status.displayClock || '';
            } catch {
                return '';
            }
        }

        getGameStatus() {
            try {
                const comp = this.summary.header.competitions[0];
                return comp.status.type.state || '';
            } catch {
                return '';
            }
        }
    }

    Scratch.extensions.register(new NFLExtension1());
})(Scratch);
