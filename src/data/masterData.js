// src/data/masterData.js

export const schedule = {
  sun: [ { time: '9:45-10:30', name: 'Analytic & Vector Geo.', topic: 'Upcoming', teacher: 'Aynul Habib (AH)' }, { time: '10:30-11:15', name: 'Fundamentals of Math', topic: 'Elements of Logic', teacher: 'Md. Alam Mondal (AM)' }, { time: '11:15-12:00', name: 'Statistics (NM)', topic: 'Statistics', teacher: '(NM)' }, { time: '12:00-12:45', name: 'Physics (NM)', topic: 'Physics', teacher: '(PHY)' } ],
  mon: [ { time: '9:45-10:30', name: 'Fundamentals of Math', topic: 'Real Number System', teacher: 'Nirmal Chandra Paul (NP)' }, { time: '10:30-11:15', name: 'Linear Algebra', topic: 'Matrices & Determinants', teacher: 'Nasrin Sultana (NS)' }, { time: '11:15-12:00', name: 'Calculus', topic: 'Integral Calculus', teacher: 'Arifur Rahman Jewel (ARJ)' }, { time: '12:00-12:45', name: 'NM-PHY', topic: '', teacher: '' } ],
  tue: [ { time: '9:45-10:30', name: 'Linear Algebra', topic: 'Vectors in R^n and C^n', teacher: 'Md. Rafiqul Islam (RI)' }, { time: '10:30-11:15', name: 'Analytic & Vector Geo.', topic: 'Transformation of coordinates', teacher: 'Anisur Rahman (AR)' }, { time: '11:15-12:00', name: 'Fundamentals of Math', topic: 'Complex Number', teacher: 'Fokhrol Islam (FI)' }, { time: '12:00-12:45', name: 'STAT-NM', topic: '', teacher: '' } ],
  wed: [ { time: '9:45-10:30', name: 'Linear Algebra', topic: '', teacher: '' }, { time: '10:30-11:15', name: 'Analytic & Vector Geo.', topic: '', teacher: '' }, { time: '11:15-12:00', name: 'Analytic & Vector Geo.', topic: '', teacher: '' }, { time: '12:00-12:45', name: 'Statistics (Probable)', topic: '', teacher: '' } ],
  thu: [ { time: '9:45-10:30', name: 'Calculus', topic: 'Function & their graph', teacher: 'Mizanur Rahman (MR)' }, { time: '10:30-11:15', name: 'Fundamentals of Math', topic: 'Complex Number', teacher: 'Fokhrol Islam (FI)' }, { time: '11:15-12:00', name: 'Fundamentals of Math', topic: 'Real Number System', teacher: 'Nirmal Chandra Paul (NP)' }, { time: '12:00-12:45', name: 'Upcoming', topic: '', teacher: '' } ],
};

export const courses = [
  'Fundamentals of Mathematics (223701)',
  'Analytic & Vector Geometry (223703)',
  'Calculus-II (223705)',
  'Linear Algebra (223709)',
  'Physics-II (222707)',
  'Statistics (NM)'
];

export const tasks = [];

export const resources = {
  'calculus': {
    name: 'Calculus',
    chapters: {}
  },
  'algebra': {
    name: 'Algebra',
    chapters: {}
  },
  'geometry': {
    name: 'Geometry',
    chapters: {}
  },
  'physics': {
    name: 'Physics',
    chapters: {}
  },
  'general-math': {
    name: 'General Math',
    chapters: {}
  },
  'past-papers': {
    name: 'Past Papers',
    chapters: {}
  }
};