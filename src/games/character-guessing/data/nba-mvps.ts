import type { ThemeConfig } from "../types";

export interface NbaMvpSeason {
  readonly id: string;
  readonly playerName: string;
  readonly season: string;
  readonly seasonStartYear: number;
  readonly team: string;
  readonly ppg: number;
  readonly rpg: number;
  readonly apg: number;
  readonly spg: number;
  readonly bpg: number;
  readonly wins: number;
  readonly losses: number;
}

/**
 * Static regular-season snapshot researched 2026-09-11.
 * Winners: https://www.nba.com/news/history-mvp-award-winners
 * 2025-26 cross-check: https://www.nba.com/news/2025-2026-regular-season-awards
 * Per-game statistics: https://www.basketball-reference.com/awards/mvp.html
 * Each row cites its team-season record source. No runtime requests.
 */
export const nbaMvpSeasons: readonly NbaMvpSeason[] = [
  // Team record: https://www.basketball-reference.com/teams/MIL/1974.html
  { id: "nba-mvp-1973-74", playerName: "Kareem Abdul-Jabbar", season: "1973-74", seasonStartYear: 1973, team: "Milwaukee Bucks", ppg: 27.0, rpg: 14.5, apg: 4.8, spg: 1.4, bpg: 3.5, wins: 59, losses: 23 },
  // Team record: https://www.basketball-reference.com/teams/BUF/1975.html
  { id: "nba-mvp-1974-75", playerName: "Bob McAdoo", season: "1974-75", seasonStartYear: 1974, team: "Buffalo Braves", ppg: 34.5, rpg: 14.1, apg: 2.2, spg: 1.1, bpg: 2.1, wins: 49, losses: 33 },
  // Team record: https://www.basketball-reference.com/teams/LAL/1976.html
  { id: "nba-mvp-1975-76", playerName: "Kareem Abdul-Jabbar", season: "1975-76", seasonStartYear: 1975, team: "Los Angeles Lakers", ppg: 27.7, rpg: 16.9, apg: 5.0, spg: 1.5, bpg: 4.1, wins: 40, losses: 42 },
  // Team record: https://www.basketball-reference.com/teams/LAL/1977.html
  { id: "nba-mvp-1976-77", playerName: "Kareem Abdul-Jabbar", season: "1976-77", seasonStartYear: 1976, team: "Los Angeles Lakers", ppg: 26.2, rpg: 13.3, apg: 3.9, spg: 1.2, bpg: 3.2, wins: 53, losses: 29 },
  // Team record: https://www.basketball-reference.com/teams/POR/1978.html
  { id: "nba-mvp-1977-78", playerName: "Bill Walton", season: "1977-78", seasonStartYear: 1977, team: "Portland Trail Blazers", ppg: 18.9, rpg: 13.2, apg: 5.0, spg: 1.0, bpg: 2.5, wins: 58, losses: 24 },
  // Team record: https://www.basketball-reference.com/teams/HOU/1979.html
  { id: "nba-mvp-1978-79", playerName: "Moses Malone", season: "1978-79", seasonStartYear: 1978, team: "Houston Rockets", ppg: 24.8, rpg: 17.6, apg: 1.8, spg: 1.0, bpg: 1.5, wins: 47, losses: 35 },
  // Team record: https://www.basketball-reference.com/teams/LAL/1980.html
  { id: "nba-mvp-1979-80", playerName: "Kareem Abdul-Jabbar", season: "1979-80", seasonStartYear: 1979, team: "Los Angeles Lakers", ppg: 24.8, rpg: 10.8, apg: 4.5, spg: 1.0, bpg: 3.4, wins: 60, losses: 22 },
  // Team record: https://www.basketball-reference.com/teams/PHI/1981.html
  { id: "nba-mvp-1980-81", playerName: "Julius Erving", season: "1980-81", seasonStartYear: 1980, team: "Philadelphia 76ers", ppg: 24.6, rpg: 8.0, apg: 4.4, spg: 2.1, bpg: 1.8, wins: 62, losses: 20 },
  // Team record: https://www.basketball-reference.com/teams/HOU/1982.html
  { id: "nba-mvp-1981-82", playerName: "Moses Malone", season: "1981-82", seasonStartYear: 1981, team: "Houston Rockets", ppg: 31.1, rpg: 14.7, apg: 1.8, spg: 0.9, bpg: 1.5, wins: 46, losses: 36 },
  // Team record: https://www.basketball-reference.com/teams/PHI/1983.html
  { id: "nba-mvp-1982-83", playerName: "Moses Malone", season: "1982-83", seasonStartYear: 1982, team: "Philadelphia 76ers", ppg: 24.5, rpg: 15.3, apg: 1.3, spg: 1.1, bpg: 2.0, wins: 65, losses: 17 },
  // Team record: https://www.basketball-reference.com/teams/BOS/1984.html
  { id: "nba-mvp-1983-84", playerName: "Larry Bird", season: "1983-84", seasonStartYear: 1983, team: "Boston Celtics", ppg: 24.2, rpg: 10.1, apg: 6.6, spg: 1.8, bpg: 0.9, wins: 62, losses: 20 },
  // Team record: https://www.basketball-reference.com/teams/BOS/1985.html
  { id: "nba-mvp-1984-85", playerName: "Larry Bird", season: "1984-85", seasonStartYear: 1984, team: "Boston Celtics", ppg: 28.7, rpg: 10.5, apg: 6.6, spg: 1.6, bpg: 1.2, wins: 63, losses: 19 },
  // Team record: https://www.basketball-reference.com/teams/BOS/1986.html
  { id: "nba-mvp-1985-86", playerName: "Larry Bird", season: "1985-86", seasonStartYear: 1985, team: "Boston Celtics", ppg: 25.8, rpg: 9.8, apg: 6.8, spg: 2.0, bpg: 0.6, wins: 67, losses: 15 },
  // Team record: https://www.basketball-reference.com/teams/LAL/1987.html
  { id: "nba-mvp-1986-87", playerName: "Magic Johnson", season: "1986-87", seasonStartYear: 1986, team: "Los Angeles Lakers", ppg: 23.9, rpg: 6.3, apg: 12.2, spg: 1.7, bpg: 0.5, wins: 65, losses: 17 },
  // Team record: https://www.basketball-reference.com/teams/CHI/1988.html
  { id: "nba-mvp-1987-88", playerName: "Michael Jordan", season: "1987-88", seasonStartYear: 1987, team: "Chicago Bulls", ppg: 35.0, rpg: 5.5, apg: 5.9, spg: 3.2, bpg: 1.6, wins: 50, losses: 32 },
  // Team record: https://www.basketball-reference.com/teams/LAL/1989.html
  { id: "nba-mvp-1988-89", playerName: "Magic Johnson", season: "1988-89", seasonStartYear: 1988, team: "Los Angeles Lakers", ppg: 22.5, rpg: 7.9, apg: 12.8, spg: 1.8, bpg: 0.3, wins: 57, losses: 25 },
  // Team record: https://www.basketball-reference.com/teams/LAL/1990.html
  { id: "nba-mvp-1989-90", playerName: "Magic Johnson", season: "1989-90", seasonStartYear: 1989, team: "Los Angeles Lakers", ppg: 22.3, rpg: 6.6, apg: 11.5, spg: 1.7, bpg: 0.4, wins: 63, losses: 19 },
  // Team record: https://www.basketball-reference.com/teams/CHI/1991.html
  { id: "nba-mvp-1990-91", playerName: "Michael Jordan", season: "1990-91", seasonStartYear: 1990, team: "Chicago Bulls", ppg: 31.5, rpg: 6.0, apg: 5.5, spg: 2.7, bpg: 1.0, wins: 61, losses: 21 },
  // Team record: https://www.basketball-reference.com/teams/CHI/1992.html
  { id: "nba-mvp-1991-92", playerName: "Michael Jordan", season: "1991-92", seasonStartYear: 1991, team: "Chicago Bulls", ppg: 30.1, rpg: 6.4, apg: 6.1, spg: 2.3, bpg: 0.9, wins: 67, losses: 15 },
  // Team record: https://www.basketball-reference.com/teams/PHO/1993.html
  { id: "nba-mvp-1992-93", playerName: "Charles Barkley", season: "1992-93", seasonStartYear: 1992, team: "Phoenix Suns", ppg: 25.6, rpg: 12.2, apg: 5.1, spg: 1.6, bpg: 1.0, wins: 62, losses: 20 },
  // Team record: https://www.basketball-reference.com/teams/HOU/1994.html
  { id: "nba-mvp-1993-94", playerName: "Hakeem Olajuwon", season: "1993-94", seasonStartYear: 1993, team: "Houston Rockets", ppg: 27.3, rpg: 11.9, apg: 3.6, spg: 1.6, bpg: 3.7, wins: 58, losses: 24 },
  // Team record: https://www.basketball-reference.com/teams/SAS/1995.html
  { id: "nba-mvp-1994-95", playerName: "David Robinson", season: "1994-95", seasonStartYear: 1994, team: "San Antonio Spurs", ppg: 27.6, rpg: 10.8, apg: 2.9, spg: 1.7, bpg: 3.2, wins: 62, losses: 20 },
  // Team record: https://www.basketball-reference.com/teams/CHI/1996.html
  { id: "nba-mvp-1995-96", playerName: "Michael Jordan", season: "1995-96", seasonStartYear: 1995, team: "Chicago Bulls", ppg: 30.4, rpg: 6.6, apg: 4.3, spg: 2.2, bpg: 0.5, wins: 72, losses: 10 },
  // Team record: https://www.basketball-reference.com/teams/UTA/1997.html
  { id: "nba-mvp-1996-97", playerName: "Karl Malone", season: "1996-97", seasonStartYear: 1996, team: "Utah Jazz", ppg: 27.4, rpg: 9.9, apg: 4.5, spg: 1.4, bpg: 0.6, wins: 64, losses: 18 },
  // Team record: https://www.basketball-reference.com/teams/CHI/1998.html
  { id: "nba-mvp-1997-98", playerName: "Michael Jordan", season: "1997-98", seasonStartYear: 1997, team: "Chicago Bulls", ppg: 28.7, rpg: 5.8, apg: 3.5, spg: 1.7, bpg: 0.5, wins: 62, losses: 20 },
  // Team record: https://www.basketball-reference.com/teams/UTA/1999.html
  { id: "nba-mvp-1998-99", playerName: "Karl Malone", season: "1998-99", seasonStartYear: 1998, team: "Utah Jazz", ppg: 23.8, rpg: 9.4, apg: 4.1, spg: 1.3, bpg: 0.6, wins: 37, losses: 13 },
  // Team record: https://www.basketball-reference.com/teams/LAL/2000.html
  { id: "nba-mvp-1999-00", playerName: "Shaquille O'Neal", season: "1999-00", seasonStartYear: 1999, team: "Los Angeles Lakers", ppg: 29.7, rpg: 13.6, apg: 3.8, spg: 0.5, bpg: 3.0, wins: 67, losses: 15 },
  // Team record: https://www.basketball-reference.com/teams/PHI/2001.html
  { id: "nba-mvp-2000-01", playerName: "Allen Iverson", season: "2000-01", seasonStartYear: 2000, team: "Philadelphia 76ers", ppg: 31.1, rpg: 3.8, apg: 4.6, spg: 2.5, bpg: 0.3, wins: 56, losses: 26 },
  // Team record: https://www.basketball-reference.com/teams/SAS/2002.html
  { id: "nba-mvp-2001-02", playerName: "Tim Duncan", season: "2001-02", seasonStartYear: 2001, team: "San Antonio Spurs", ppg: 25.5, rpg: 12.7, apg: 3.7, spg: 0.7, bpg: 2.5, wins: 58, losses: 24 },
  // Team record: https://www.basketball-reference.com/teams/SAS/2003.html
  { id: "nba-mvp-2002-03", playerName: "Tim Duncan", season: "2002-03", seasonStartYear: 2002, team: "San Antonio Spurs", ppg: 23.3, rpg: 12.9, apg: 3.9, spg: 0.7, bpg: 2.9, wins: 60, losses: 22 },
  // Team record: https://www.basketball-reference.com/teams/MIN/2004.html
  { id: "nba-mvp-2003-04", playerName: "Kevin Garnett", season: "2003-04", seasonStartYear: 2003, team: "Minnesota Timberwolves", ppg: 24.2, rpg: 13.9, apg: 5.0, spg: 1.5, bpg: 2.2, wins: 58, losses: 24 },
  // Team record: https://www.basketball-reference.com/teams/PHO/2005.html
  { id: "nba-mvp-2004-05", playerName: "Steve Nash", season: "2004-05", seasonStartYear: 2004, team: "Phoenix Suns", ppg: 15.5, rpg: 3.3, apg: 11.5, spg: 1.0, bpg: 0.1, wins: 62, losses: 20 },
  // Team record: https://www.basketball-reference.com/teams/PHO/2006.html
  { id: "nba-mvp-2005-06", playerName: "Steve Nash", season: "2005-06", seasonStartYear: 2005, team: "Phoenix Suns", ppg: 18.8, rpg: 4.2, apg: 10.5, spg: 0.8, bpg: 0.2, wins: 54, losses: 28 },
  // Team record: https://www.basketball-reference.com/teams/DAL/2007.html
  { id: "nba-mvp-2006-07", playerName: "Dirk Nowitzki", season: "2006-07", seasonStartYear: 2006, team: "Dallas Mavericks", ppg: 24.6, rpg: 8.9, apg: 3.4, spg: 0.7, bpg: 0.8, wins: 67, losses: 15 },
  // Team record: https://www.basketball-reference.com/teams/LAL/2008.html
  { id: "nba-mvp-2007-08", playerName: "Kobe Bryant", season: "2007-08", seasonStartYear: 2007, team: "Los Angeles Lakers", ppg: 28.3, rpg: 6.3, apg: 5.4, spg: 1.8, bpg: 0.5, wins: 57, losses: 25 },
  // Team record: https://www.basketball-reference.com/teams/CLE/2009.html
  { id: "nba-mvp-2008-09", playerName: "LeBron James", season: "2008-09", seasonStartYear: 2008, team: "Cleveland Cavaliers", ppg: 28.4, rpg: 7.6, apg: 7.2, spg: 1.7, bpg: 1.1, wins: 66, losses: 16 },
  // Team record: https://www.basketball-reference.com/teams/CLE/2010.html
  { id: "nba-mvp-2009-10", playerName: "LeBron James", season: "2009-10", seasonStartYear: 2009, team: "Cleveland Cavaliers", ppg: 29.7, rpg: 7.3, apg: 8.6, spg: 1.6, bpg: 1.0, wins: 61, losses: 21 },
  // Team record: https://www.basketball-reference.com/teams/CHI/2011.html
  { id: "nba-mvp-2010-11", playerName: "Derrick Rose", season: "2010-11", seasonStartYear: 2010, team: "Chicago Bulls", ppg: 25.0, rpg: 4.1, apg: 7.7, spg: 1.0, bpg: 0.6, wins: 62, losses: 20 },
  // Team record: https://www.basketball-reference.com/teams/MIA/2012.html
  { id: "nba-mvp-2011-12", playerName: "LeBron James", season: "2011-12", seasonStartYear: 2011, team: "Miami Heat", ppg: 27.1, rpg: 7.9, apg: 6.2, spg: 1.9, bpg: 0.8, wins: 46, losses: 20 },
  // Team record: https://www.basketball-reference.com/teams/MIA/2013.html
  { id: "nba-mvp-2012-13", playerName: "LeBron James", season: "2012-13", seasonStartYear: 2012, team: "Miami Heat", ppg: 26.8, rpg: 8.0, apg: 7.3, spg: 1.7, bpg: 0.9, wins: 66, losses: 16 },
  // Team record: https://www.basketball-reference.com/teams/OKC/2014.html
  { id: "nba-mvp-2013-14", playerName: "Kevin Durant", season: "2013-14", seasonStartYear: 2013, team: "Oklahoma City Thunder", ppg: 32.0, rpg: 7.4, apg: 5.5, spg: 1.3, bpg: 0.7, wins: 59, losses: 23 },
  // Team record: https://www.basketball-reference.com/teams/GSW/2015.html
  { id: "nba-mvp-2014-15", playerName: "Stephen Curry", season: "2014-15", seasonStartYear: 2014, team: "Golden State Warriors", ppg: 23.8, rpg: 4.3, apg: 7.7, spg: 2.0, bpg: 0.2, wins: 67, losses: 15 },
  // Team record: https://www.basketball-reference.com/teams/GSW/2016.html
  { id: "nba-mvp-2015-16", playerName: "Stephen Curry", season: "2015-16", seasonStartYear: 2015, team: "Golden State Warriors", ppg: 30.1, rpg: 5.4, apg: 6.7, spg: 2.1, bpg: 0.2, wins: 73, losses: 9 },
  // Team record: https://www.basketball-reference.com/teams/OKC/2017.html
  { id: "nba-mvp-2016-17", playerName: "Russell Westbrook", season: "2016-17", seasonStartYear: 2016, team: "Oklahoma City Thunder", ppg: 31.6, rpg: 10.7, apg: 10.4, spg: 1.6, bpg: 0.4, wins: 47, losses: 35 },
  // Team record: https://www.basketball-reference.com/teams/HOU/2018.html
  { id: "nba-mvp-2017-18", playerName: "James Harden", season: "2017-18", seasonStartYear: 2017, team: "Houston Rockets", ppg: 30.4, rpg: 5.4, apg: 8.8, spg: 1.8, bpg: 0.7, wins: 65, losses: 17 },
  // Team record: https://www.basketball-reference.com/teams/MIL/2019.html
  { id: "nba-mvp-2018-19", playerName: "Giannis Antetokounmpo", season: "2018-19", seasonStartYear: 2018, team: "Milwaukee Bucks", ppg: 27.7, rpg: 12.5, apg: 5.9, spg: 1.3, bpg: 1.5, wins: 60, losses: 22 },
  // Team record: https://www.basketball-reference.com/teams/MIL/2020.html
  { id: "nba-mvp-2019-20", playerName: "Giannis Antetokounmpo", season: "2019-20", seasonStartYear: 2019, team: "Milwaukee Bucks", ppg: 29.5, rpg: 13.6, apg: 5.6, spg: 1.0, bpg: 1.0, wins: 56, losses: 17 },
  // Team record: https://www.basketball-reference.com/teams/DEN/2021.html
  { id: "nba-mvp-2020-21", playerName: "Nikola Jokić", season: "2020-21", seasonStartYear: 2020, team: "Denver Nuggets", ppg: 26.4, rpg: 10.8, apg: 8.3, spg: 1.3, bpg: 0.7, wins: 47, losses: 25 },
  // Team record: https://www.basketball-reference.com/teams/DEN/2022.html
  { id: "nba-mvp-2021-22", playerName: "Nikola Jokić", season: "2021-22", seasonStartYear: 2021, team: "Denver Nuggets", ppg: 27.1, rpg: 13.8, apg: 7.9, spg: 1.5, bpg: 0.9, wins: 48, losses: 34 },
  // Team record: https://www.basketball-reference.com/teams/PHI/2023.html
  { id: "nba-mvp-2022-23", playerName: "Joel Embiid", season: "2022-23", seasonStartYear: 2022, team: "Philadelphia 76ers", ppg: 33.1, rpg: 10.2, apg: 4.2, spg: 1.0, bpg: 1.7, wins: 54, losses: 28 },
  // Team record: https://www.basketball-reference.com/teams/DEN/2024.html
  { id: "nba-mvp-2023-24", playerName: "Nikola Jokić", season: "2023-24", seasonStartYear: 2023, team: "Denver Nuggets", ppg: 26.4, rpg: 12.4, apg: 9.0, spg: 1.4, bpg: 0.9, wins: 57, losses: 25 },
  // Team record: https://www.basketball-reference.com/teams/OKC/2025.html
  { id: "nba-mvp-2024-25", playerName: "Shai Gilgeous-Alexander", season: "2024-25", seasonStartYear: 2024, team: "Oklahoma City Thunder", ppg: 32.7, rpg: 5.0, apg: 6.4, spg: 1.7, bpg: 1.0, wins: 68, losses: 14 },
  // Team record: https://www.basketball-reference.com/teams/OKC/2026.html
  { id: "nba-mvp-2025-26", playerName: "Shai Gilgeous-Alexander", season: "2025-26", seasonStartYear: 2025, team: "Oklahoma City Thunder", ppg: 31.1, rpg: 4.3, apg: 6.6, spg: 1.4, bpg: 0.8, wins: 64, losses: 18 },
];

export const nbaMvps: ThemeConfig<NbaMvpSeason> = {
  id: "nba-mvps",
  characters: nbaMvpSeasons,
  name: (candidate) => `${candidate.playerName} — ${candidate.season}`,
  traits: [],
};
