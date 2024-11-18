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
