import { WIPES_CUT_OFF } from "./constants";

export const playerInfoQuery = `
  query($logId: String!) {
    reportData {
      report(code: $logId) {
        masterData {
          actors(type: "Player") {
            id
            name
            icon
          }
        }
      }
    }
  }
`;

export const eventsQuery = `
  query($logId: String!, $startTime: Float!, $endTime: Float!) {
    reportData {
      report(code: $logId) {
        events(dataType: Deaths, startTime: $startTime, endTime: $endTime, limit: 100,wipeCutoff: ${WIPES_CUT_OFF}) {
          data
          nextPageTimestamp
        }
        fights {
          kill
          name
        }
      }
    }
  }
`;

export const tableQueryDamageTaken = `
  query($logId: String!,$fightID: Int!,$filterExpression: String) {
    reportData {
      report(code: $logId) {
        table(fightIDs: [$fightID],dataType: DamageTaken,filterExpression :$filterExpression, wipeCutoff: ${WIPES_CUT_OFF})
      }
    }
  }
`;

export const tableQuery = `
  query($logId: String!, $startTime: Float!, $endTime: Float!, $filterExpression: String) {
    reportData {
      report(code: $logId) {
        table(startTime: $startTime, endTime: $endTime, dataType: DamageDone, wipeCutoff: ${WIPES_CUT_OFF} ,filterExpression :$filterExpression)
      }
    }
  }
`;

export const fightsQuery = `
  query($logId: String!) {
    reportData {
      report(code: $logId) {
        code
        title
        startTime
        endTime
        guild {
          name
        }
        fights {
          id
          startTime
          endTime
          name
          kill
        }
      }
    }
  }
`;
export const castsQuery = `
  query($logId: String!, $startTime: Float!, $endTime: Float!, $filterExpression: String) {
    reportData {
      report(code: $logId) {
        table(startTime: $startTime, endTime: $endTime, dataType: Casts, wipeCutoff: ${WIPES_CUT_OFF} ,filterExpression :$filterExpression)
      }
    }
  }
`;

export const totalCastsQuery = `
  query($logId: String!, $startTime: Float!, $endTime: Float!) {
    reportData {
      report(code: $logId) {
        table(startTime: $startTime, endTime: $endTime, dataType: Casts, wipeCutoff: ${WIPES_CUT_OFF},killType: Encounters)
      }
    }
  }
`;

export const dispelsQuery = `
  query($logId: String!, $startTime: Float!, $endTime: Float!) {
    reportData {
      report(code: $logId) {
        table(startTime: $startTime, endTime: $endTime, dataType: Dispels, wipeCutoff: ${WIPES_CUT_OFF})
      }
    }
  }
`;

export const debuffsQuery = `
  query($logId: String!, $startTime: Float!, $endTime: Float!) {
    reportData {
      report(code: $logId) {
        table(startTime: $startTime, endTime: $endTime, dataType: Debuffs, wipeCutoff: ${WIPES_CUT_OFF}, hostilityType :Enemies)
      }
    }
  }
`;

export const buffsQuery = `
  query($logId: String!, $startTime: Float!, $endTime: Float!, $filterExpression: String) {
    reportData {
      report(code: $logId) {
        events(startTime: $startTime, endTime: $endTime, dataType: Buffs, filterExpression :$filterExpression,limit: 1000) {
        data
        }
      }
    }
  }
`;

export const guildLogs = `
     query FetchGuildLogs($guildID: Int!, $page: Int!, $startTime: Float!, $endTime: Float!) {
        reportData {
          reports(guildID: $guildID, page: $page,startTime: $startTime, endTime: $endTime) {
            data {
              code
              title
              startTime
              endTime
              zone {
                name
              }
            }
            total
            per_page
            current_page
            has_more_pages
          }
        }
      }
    `;
