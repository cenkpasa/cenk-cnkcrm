import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Task, ViewState } from '../types';
import DataTable from '../components/common/DataTable';
import Button from '../components/common/Button';
import TaskForm from '../components/forms/TaskForm';

const TasksPage = ({ setView }: { setView: (view: ViewState) => void; }) => {
    const { tasks, updateTask } = useData();
    const { users } = useAuth();
    const { t } = useLanguage();
    
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    const handleTaskStatusChange = (task: Task) => {
        updateTask({ ...task, status: task.status === 'pending' ? 'completed' : 'pending' });
    };

    const handleEditTask = (task: Task) => {
        setSelectedTask(task);
        setIsFormModalOpen(true);
    };

    const handleAddTask = () => {
        setSelectedTask(null);
        setIsFormModalOpen(true);
    };

    const columns = [
        { 
            header: t('status'), 
            accessor: (item: Task) => (
                <input 
                    type="checkbox" 
                    checked={item.status === 'completed'} 
                    onChange={() => handleTaskStatusChange(item)} 
                    className="h-5 w-5 rounded text-cnk-accent-primary focus:ring-cnk-accent-primary"
                />
            )
        },
        { header: t('taskTitle'), accessor: (item: Task) => <span className={`${item.status === 'completed' ? 'line-through text-cnk-txt-muted-light' : ''}`}>{item.title}</span> },
        { header: t('assignedTo'), accessor: (item: Task) => users.find(u => u.id === item.assignedTo)?.name || '-' },
        { header: t('dueDate'), accessor: (item: Task) => new Date(item.dueDate).toLocaleDateString() },
        { 
            header: t('actions'), 
            accessor: (item: Task) => (
                <Button variant="info" size="sm" onClick={() => handleEditTask(item)} icon="fas fa-edit" aria-label={t('editTask')} />
            )
        },
    ];

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">{t('tasks')}</h1>
                <Button variant="primary" onClick={handleAddTask} icon="fas fa-plus">{t('addNewTask')}</Button>
            </div>
            <DataTable
                columns={columns}
                data={tasks}
                itemsPerPage={15}
                emptyStateMessage={t('noTasksYet')}
            />
            {isFormModalOpen && (
                <TaskForm 
                    isOpen={isFormModalOpen}
                    onClose={() => setIsFormModalOpen(false)}
                    task={selectedTask}
                />
            )}
        </div>
    );
};

export default TasksPage;