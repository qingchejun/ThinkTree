'use client'

import React from 'react';
import { Button } from './Button';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex items-center justify-center space-x-2 mt-4">
      <Button onClick={handlePrevious} disabled={currentPage === 1} variant="outline">
        上一页
      </Button>
      <span className="text-sm text-gray-600">
        第 {currentPage} 页 / 共 {totalPages} 页
      </span>
      <Button onClick={handleNext} disabled={currentPage === totalPages} variant="outline">
        下一页
      </Button>
    </div>
  );
};

export default Pagination;