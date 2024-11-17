"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventsQueryWithCasts = exports.fightsQuery = exports.tableQuery = exports.tableQueryDamageTaken = exports.eventsQuery = exports.playerInfoQuery = void 0;
exports.playerInfoQuery = `
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
exports.eventsQuery = `
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
exports.tableQueryDamageTaken = `
  query($logId: String!,$fightID: Int!,$filterExpression: String) {
    reportData {
      report(code: $logId) {
        table(fightIDs: [$fightID],dataType: DamageTaken,filterExpression :$filterExpression, wipeCutoff: 6)
      }
    }
  }
`;
exports.tableQuery = `
  query($logId: String!, $startTime: Float!, $endTime: Float!) {
    reportData {
      report(code: $logId) {
        table(startTime: $startTime, endTime: $endTime, dataType: DamageDone, wipeCutoff: 6)
      }
    }
  }
`;
exports.fightsQuery = `
  query($logId: String!) {
    reportData {
      report(code: $logId) {
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
exports.eventsQueryWithCasts = `
  query($logId: String!, $startTime: Float!, $endTime: Float!) {
    reportData {
      report(code: $logId) {
        events(
          dataType: All, 
          startTime: $startTime, 
          endTime: $endTime, 
        ) {
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
//# sourceMappingURL=queries.js.map