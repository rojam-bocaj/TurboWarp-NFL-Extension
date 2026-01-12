(function (Scratch) {
    'use strict';

    class NFLExtension2 {
        getInfo() {
            return {
                id: 'nflExtension2',
                name: 'NFL EXTENSION 2',
                blocks: [
                    // -------- TEAM STATS --------
                    { opcode: 'getTotalYards', blockType: Scratch.BlockType.REPORTER, text: 'total yards' },
                    { opcode: 'getPassingYards', blockType: Scratch.BlockType.REPORTER, text: 'passing yards' },
                    { opcode: 'getRushingYards', blockType: Scratch.BlockType.REPORTER, text: 'rushing yards' },
                    { opcode: 'getFirstDowns', blockType: Scratch.BlockType.REPORTER, text: 'first downs' },
                    { opcode: 'getThirdDownEfficiency', blockType: Scratch.BlockType.REPORTER, text: 'third down efficiency' },
                    { opcode: 'getTurnovers', blockType: Scratch.BlockType.REPORTER, text: 'turnovers' },
                    { opcode: 'getTimeOfPossession', blockType: Scratch.BlockType.REPORTER, text: 'time of possession' },

                    // -------- GAME INFO --------
                    { opcode: 'getVenue', blockType: Scratch.BlockType.REPORTER, text: 'venue' },
                    { opcode: 'getAttendance', blockType: Scratch.BlockType.REPORTER, text: 'attendance' },
                    { opcode: 'getWeather', blockType: Scratch.BlockType.REPORTER, text: 'weather' },
                    { opcode: 'getOfficials', blockType: Scratch.BlockType.REPORTER, text: 'officials' },

                    // -------- RED ZONE --------
                    { opcode: 'getRedZoneStatus', blockType: Scratch.BlockType.REPORTER, text: 'red zone status' },

                    // -------- SCORING PLAYS --------
                    { opcode: 'getScoringPlaysStructured', blockType: Scratch.BlockType.REPORTER, text: 'scoring plays structured' }
                ]
            };
        }

        // -------- SHARED DATA ACCESS --------
        get summary() {
            return Scratch.vm.runtime.nflShared?.SUMMARY || {};
        }

        // -------- TEAM STATS HELPER --------
        getTeamStatList(matchFn) {
            const teams = this.summary?.boxscore?.teams;
            if (!Array.isArray(teams)) return [];

            return teams.map(team => {
                const name = team.team?.shortDisplayName || 'Team';
                const stats = team.statistics || [];
                const stat = stats.find(matchFn);
                const value = stat?.displayValue ?? '?';
                return `${name}: ${value}`;
            });
        }

        // -------- TEAM STATS --------
        getTotalYards() {
            return this.getTeamStatList(s => s.name === 'totalYards' || s.abbreviation === 'TY');
        }
        getPassingYards() {
            return this.getTeamStatList(s => s.name === 'netPassingYards' || s.abbreviation === 'PY');
        }
        getRushingYards() {
            return this.getTeamStatList(s => s.name === 'rushingYards' || s.abbreviation === 'RY');
        }
        getFirstDowns() {
            return this.getTeamStatList(s => s.name === 'firstDowns' || s.abbreviation === 'FD');
        }
        getThirdDownEfficiency() {
            return this.getTeamStatList(s => s.name === 'thirdDownEff' || s.abbreviation === '3D');
        }
        getTurnovers() {
            return this.getTeamStatList(s => s.name === 'turnovers' || s.abbreviation === 'TO');
        }
        getTimeOfPossession() {
            return this.getTeamStatList(s => s.name === 'possessionTime' || s.abbreviation === 'TOP');
        }

        // -------- GAME INFO --------
        getVenue() {
            const v = this.summary?.gameInfo?.venue;
            if (!v) return '';
            const name = v.fullName || v.name || '';
            const city = v.address?.city || '';
            const state = v.address?.state || '';
            return city || state ? `${name} (${city}${city && state ? ', ' : ''}${state})` : name;
        }

        getAttendance() {
            const a = this.summary?.gameInfo?.attendance;
            return a ? `Attendance: ${a}` : '';
        }

        getWeather() {
            const w = this.summary?.gameInfo?.weather;
            if (!w) return '';
            const temp = w.temperature != null ? `${w.temperature}°` : '';
            const cond = w.displayValue || w.description || '';
            return temp && cond ? `${temp}, ${cond}` : temp || cond;
        }

        getOfficials() {
            const o = this.summary?.gameInfo?.officials;
            if (!Array.isArray(o)) return [];
            return o.map(ref => {
                const name = ref.displayName || 'Official';
                const pos = ref.position || ref.positionName || '';
                return pos ? `${name} (${pos})` : name;
            });
        }

        // -------- RED ZONE --------
        getRedZoneStatus() {
            const drives = this.summary?.drives?.current;
            if (drives?.isRedZone && drives.team) {
                return `${drives.team.shortDisplayName} in red zone`;
            }

            const comps = this.summary?.header?.competitions?.[0]?.competitors;
            if (Array.isArray(comps)) {
                const red = comps.find(c => c.isRedZone);
                if (red) return `${red.team.shortDisplayName} in red zone`;
            }

            return '';
        }

        // -------- SCORING PLAYS --------
        periodToLabel(p) {
            if (p === 1) return '1ST QUARTER';
            if (p === 2) return '2ND QUARTER';
            if (p === 3) return '3RD QUARTER';
            if (p === 4) return '4TH QUARTER';
            return 'OT';
        }

        getScoringPlaysStructured() {
            const plays = this.summary?.scoringPlays;
            if (!Array.isArray(plays)) return [];

            const out = [];

            for (const p of plays) {
                const quarter = this.periodToLabel(p.period);
                const clock = p.clock || '';
                const team = p.team?.shortDisplayName || 'Team';
                const base = p.text || p.description || '';

                // Players with jersey numbers
                const players = [];
                if (Array.isArray(p.participants)) {
                    for (const part of p.participants) {
                        const a = part.athlete;
                        if (!a) continue;
                        const name = a.displayName || a.shortName;
                        const jersey = a.jersey ? ` #${a.jersey}` : '';
                        players.push(name + jersey);
                    }
                }

                let playerText = '';
                if (players.length === 1) playerText = players[0];
                else if (players.length === 2) playerText = `${players[0]} to ${players[1]}`;
                else if (players.length > 2) playerText = players.join(', ');

                const desc = playerText
                    ? `${team}: ${base} (${playerText})`
                    : `${team}: ${base}`;

                out.push([quarter, clock, desc]);
            }

            return out;
        }
    }

    Scratch.extensions.register(new NFLExtension2());
})(Scratch);
