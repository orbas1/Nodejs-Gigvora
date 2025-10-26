import TaskKanban from '../TaskKanban.jsx';

export default function TaskBoardTab(props) {
  return <TaskKanban {...props} />;
}

TaskBoardTab.propTypes = TaskKanban.propTypes;
