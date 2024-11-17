export const playerInfoQuery = `
  query($logId: String!) {
    reportData {
      report(code: $logId) {
        masterData {
          actors(type: "Player") {
            id
            name
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
        events(dataType: Deaths, startTime: $startTime, endTime: $endTime, limit: 100,wipeCutoff: 6) {
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
        table(fightIDs: [$fightID],dataType: DamageTaken,filterExpression :$filterExpression, wipeCutoff: 6)
      }
    }
  }
`;

export const tableQuery = `
  query($logId: String!, $startTime: Float!, $endTime: Float!) {
    reportData {
      report(code: $logId) {
        table(startTime: $startTime, endTime: $endTime, dataType: DamageDone, wipeCutoff: 6)
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
