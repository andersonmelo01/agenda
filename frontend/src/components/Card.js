import React from 'react';
import '../styles/global.css';

function Card({ children, style }) {
  return <div className="card" style={style}>{children}</div>;
}

export default Card;
