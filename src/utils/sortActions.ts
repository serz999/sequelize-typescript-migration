import type { IAction } from "./getDiffActionsFromTables";

export default function sortActions(actions: IAction[], historyTablePostfix?: string) {
  sortByActionTypePriorityOrByAbsenceOfDeps(actions, [ "removeIndex",
    "removeColumn",
    "dropTable",
    "createTable",
    "addColumn",
    "changeColumn",
    "addIndex",
  ])

  arrangeDependences(actions);

  if (historyTablePostfix) {
      arrangeHistoryTables(actions, historyTablePostfix);
  }

  return actions;
}

/*
 * As result, higher priority actions with absence
 * of deps will be first to be executed. 
 *
 * First elements of array = first to be executed
*/
function sortByActionTypePriorityOrByAbsenceOfDeps(actions: IAction[], actionTypePriority: string[]) {
    actions.sort((left: IAction, right: IAction) => {
        if (actionTypePriority.indexOf(left.actionType) < actionTypePriority.indexOf(right.actionType)) {
            return -1;
        }
        if (actionTypePriority.indexOf(left.actionType) > actionTypePriority.indexOf(right.actionType)) {
            return 1;
        }
        if (left.actionType === "dropTable" && right.actionType === "dropTable") {
            return absenceOfDepsCompare(right.depends, left.depends);
        }
        return absenceOfDepsCompare(left.depends, right.depends);
    });
}

function absenceOfDepsCompare(left: unknown[], right: unknown[]) {
    if (left.length === 0 && right.length !== 0) {
        return -1;
    }
    if (left.length !== 0 && right.length === 0) {
        return 1;
    }
    return 0;
}

function arrangeDependences(actions: IAction[]) {
    for (let i = 0; i < actions.length; i++) {
        const leftAction: IAction = actions[i];
        if (leftAction.depends.length === 0) {
            continue;
        }

        for (let j = 0; j < actions.length; j++) {
          const rightAction: IAction = actions[j];
          if (leftAction.actionType !== rightAction.actionType) {
              continue;
          }
          if (rightAction.depends.length === 0) {
              continue;
          }

          if (rightAction.depends.includes(leftAction.tableName)) {
            if (j < i) {
              const tmp = actions[i];
              actions[i] = actions[j];
              actions[j] = tmp;
            }
          } 
        }
      }
}

function arrangeHistoryTables(actions: IAction[], historyTablePostfix: string) {
    const observed: string[] = []

    for (let i = 0; i < actions.length; i++) { 
        const act = actions[i];

        if (act.actionType  !== "createTable" && act.actionType !== "dropTable") {
            continue;
        }

        if (act.tableName.endsWith(historyTablePostfix) && !observed.includes(act.tableName)) {
            const originTableName = act.tableName.replace(historyTablePostfix, "")
            const indexOfOriginTableName = getActionIdByTableName(actions, originTableName, act.actionType)
            
            if (indexOfOriginTableName === -1) {
                actions.splice(i, 1);
                i--;
                console.log("skip \"" + act.tableName + "\" migration, not found origin table reference.")
                continue;
            }
         
            if (indexOfOriginTableName < i) {
                actions.splice(indexOfOriginTableName + 1, 0, act);
                actions.splice(i + 1, 1);
                i--;
            }
            if (indexOfOriginTableName > i) { 
                actions.splice(indexOfOriginTableName + 1, 0, act);
                actions.splice(i, 1);
                i--;
            }

            observed.push(act.tableName);
        }
    }
}

function getActionIdByTableName(actions: IAction[], name: string, actionType: string): number {
    for (let i = 0; i < actions.length; i++) {
        const act = actions[i];
        if (act.tableName === name && act.actionType === actionType) {
            return i;
        }
    }

    return -1;
}
