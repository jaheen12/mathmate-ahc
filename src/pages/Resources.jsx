import React from 'react';
import ResourceList from '../components/ResourceList';

function Resources() {
  // --- EDIT THIS DATA TO ADD YOUR REAL RESOURCES ---
  // For PDFs, you can link to them if they are hosted online.
  // Later, we can make these downloadable.
  const resourceData = {
    'Calculus': [
      { 
        title: 'Howard Anton - Calculus, 10th Ed.', 
        description: 'The main textbook for our course.',
        url: 'https://archive.org/details/calculus-10th-edition-by-howard-anton-bivens-davis', // Example link
        type: 'pdf' 
      },
      { 
        title: 'Khan Academy - Calculus 1', 
        description: 'Excellent video tutorials and exercises.',
        url: 'https://www.khanacademy.org/math/calculus-1',
        type: 'link' 
      },
    ],
    'Linear Algebra': [
      { 
        title: 'Linear Algebra by Anton & Rorres', 
        description: 'Core textbook for Linear Algebra.',
        url: '#', // Add a real link here
        type: 'pdf' 
      },
      { 
        title: '3Blue1Brown - Essence of Linear Algebra', 
        description: 'The best video series for building intuition.',
        url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab',
        type: 'link' 
      },
    ],
    'Past Papers': [
       { 
        title: '2nd Year Final Exam - 2023', 
        description: 'Previous year\'s final exam questions.',
        url: '#', // Add a real link here
        type: 'pdf' 
      },
    ]
  };
  // ----------------------------------------------------

  return (
    <div className="page-container">
      <h1 className="page-title">Resource Hub</h1>
      <ResourceList resourceData={resourceData} />
    </div>
  );
}

export default Resources;