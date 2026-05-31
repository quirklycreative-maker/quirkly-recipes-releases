const { useState, useEffect } = require('react');

// Simulate React render loop
let state = { searchQuery: '', recipes: [1, 2] };
let effects = [];
let renders = 0;

function render() {
  renders++;
  console.log(`Render ${renders}: query=${state.searchQuery}, recipes=${state.recipes.length}`);
  
  const searchQuery = state.searchQuery;
  const recipes = state.recipes;
  
  const fetchRecipes = (pageNum = 1, isRefresh = false) => {
    console.log(`fetchRecipes called with query=${searchQuery}`);
    let suggestions = [];
    if (searchQuery === '') suggestions = [1, 2];
    if (searchQuery === 'Pizza') suggestions = [];
    
    if (isRefresh) {
      state.recipes = suggestions;
    }
    render(); // Trigger re-render
  }

  // Simulate useEffect
  effects.push(() => {
    console.log('Setting timer for fetchRecipes');
    const timer = setTimeout(() => {
      fetchRecipes(1, true);
    }, 300);
    return () => {
      console.log('Clearing timer');
      clearTimeout(timer);
    }
  });
}

// this is a very rough simulation, won't run easily in node without a custom scheduler.
