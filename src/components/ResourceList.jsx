import React from 'react';
import { Book, Link as LinkIcon } from 'lucide-react';

// This component will display the resources for a single category
function ResourceCategory({ category, items }) {
  return (
    <div className="resource-category">
      <h3 className="category-title">{category}</h3>
      {items.map((item, index) => (
        <a 
          key={index} 
          href={item.url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="resource-item"
        >
          <div className="resource-icon-container">
            {item.type === 'pdf' ? <Book /> : <LinkIcon />}
          </div>
          <div className="resource-details">
            <p className="resource-title">{item.title}</p>
            <p className="resource-description">{item.description}</p>
          </div>
        </a>
      ))}
    </div>
  );
}

// This is the main component for the resource hub
function ResourceList({ resourceData }) {
  return (
    <div>
      {Object.keys(resourceData).map(category => (
        <ResourceCategory 
          key={category} 
          category={category} 
          items={resourceData[category]} 
        />
      ))}
    </div>
  );
}

export default ResourceList;