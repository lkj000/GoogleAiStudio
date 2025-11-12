import React from 'react';
import { SparkleIcon } from './icons';

interface SuggestionButtonProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
}

const SuggestionButton: React.FC<SuggestionButtonProps> = ({ children, icon, onClick }) => (
  <button
    onClick={onClick}
    className="bg-primary/90 hover:bg-primary text-background font-medium py-2 px-4 rounded-full transition-colors flex items-center justify-center border border-surface"
  >
    {icon}
    {children}
  </button>
);


const SuggestionPrompts: React.FC = () => {
    return (
        <div className="text-center py-16 px-4 h-full flex flex-col items-center">
            <div className="max-w-xl">
                <p className="text-lg text-secondary">Add new features or easily modify</p>
                <p className="text-lg text-secondary mb-8">this app with a prompt or the suggestions below</p>
                <div className="flex flex-wrap justify-center items-center gap-3">
                    <SuggestionButton icon={<SparkleIcon />}>AI Features</SuggestionButton>
                    <SuggestionButton>Add more effects</SuggestionButton>
                    <SuggestionButton>Improve UI responsiveness</SuggestionButton>
                    <SuggestionButton>Add reverb damping</SuggestionButton>
                    <SuggestionButton>Enhance code highlighting</SuggestionButton>
                    <SuggestionButton>Add audio unit tests</SuggestionButton>
                </div>
            </div>
        </div>
    );
};

export default SuggestionPrompts;
