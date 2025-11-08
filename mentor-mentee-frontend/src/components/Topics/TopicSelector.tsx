import React, { useState, useEffect } from 'react';
import { Topic } from '../../types/topic';
import { topicApi } from '../../services/topicApi';
import './TopicSelector.css';

interface TopicSelectorProps {
  selectedTopicIds: number[];
  onChange: (topicIds: number[]) => void;
  label: string;
  placeholder?: string;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({ 
  selectedTopicIds, 
  onChange, 
  label,
  placeholder = "Select topics..."
}) => {
  const [allTopics, setAllTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const topics = await topicApi.getAllTopics();
        setAllTopics(topics);
      } catch (err) {
        console.error('Failed to load topics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTopics();
  }, []);

  const handleToggleTopic = (topicId: number) => {
    if (selectedTopicIds.includes(topicId)) {
      onChange(selectedTopicIds.filter(id => id !== topicId));
    } else {
      onChange([...selectedTopicIds, topicId]);
    }
  };

  const getSelectedTopics = (): Topic[] => {
    return allTopics.filter(topic => selectedTopicIds.includes(topic.id));
  };

  const handleRemoveTopic = (topicId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedTopicIds.filter(id => id !== topicId));
  };

  if (loading) {
    return <div>Loading topics...</div>;
  }

  return (
    <div className="topic-selector">
      <label>{label}</label>
      
      <div className="topic-selector-container">
        {/* Selected topics display */}
        <div className="selected-topics" onClick={() => setIsOpen(!isOpen)}>
          {selectedTopicIds.length === 0 ? (
            <span className="placeholder">{placeholder}</span>
          ) : (
            <div className="selected-topics-list">
              {getSelectedTopics().map(topic => (
                <span key={topic.id} className="selected-topic-tag">
                  {topic.name}
                  <button 
                    type="button" 
                    onClick={(e) => handleRemoveTopic(topic.id, e)}
                    className="remove-topic-btn"
                  >
                    ✖
                  </button>
                </span>
              ))}
            </div>
          )}
          <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
        </div>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="topic-dropdown">
            {allTopics.map(topic => (
              <div
                key={topic.id}
                className={`topic-option ${selectedTopicIds.includes(topic.id) ? 'selected' : ''}`}
                onClick={() => handleToggleTopic(topic.id)}
              >
                <input
                  type="checkbox"
                  checked={selectedTopicIds.includes(topic.id)}
                  onChange={() => {}} // Handled by parent div onClick
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="topic-info">
                  <div className="topic-name">{topic.name}</div>
                  {topic.description && (
                    <div className="topic-description">{topic.description}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TopicSelector;
