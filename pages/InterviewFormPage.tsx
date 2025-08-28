import React from 'react';
import { ViewState } from '../types';
import InterviewList from '../components/interviews/InterviewList';
import InterviewForm from '../components/interviews/InterviewForm';

interface InterviewFormPageProps {
    view: ViewState;
    setView: (view: ViewState) => void;
}

const InterviewFormPage = ({ view, setView }: InterviewFormPageProps) => {
    if (view.id) {
        return <InterviewForm setView={setView} interviewId={view.id} />;
    }
    return <InterviewList setView={setView} />;
};

export default InterviewFormPage;