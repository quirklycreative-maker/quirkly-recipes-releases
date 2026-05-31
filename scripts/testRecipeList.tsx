import React, { useState, useEffect } from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';

const MockRecipeService = {
  getSuggestions: async (avail: any, prefs: any, q: string) => {
    if (q === "Pizza") return [];
    return [{id: '1', name: 'Thalipeeth'}];
  },
  searchYouTubeRecipes: async (q: string) => {
    return [{video: {title: 'Pizza Video'}}];
  }
};

const RecipeListScreen = () => {
  const [recipes, setRecipes] = useState<any[]>([{id: '1', name: 'Thalipeeth'}]);
  const [searchQuery, setSearchQuery] = useState('');
  const [youtubeResults, setYoutubeResults] = useState<any[]>([]);

  const fetchRecipes = async (pageNum = 1, isRefresh = false) => {
    const suggestions = await MockRecipeService.getSuggestions([], {}, searchQuery);
    if (isRefresh) {
      setRecipes(suggestions);
    } else {
      setRecipes(prev => [...prev, ...suggestions]);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecipes(1, true);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (!query || recipes.length > 0) {
      setYoutubeResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const results = await MockRecipeService.searchYouTubeRecipes(query);
      setYoutubeResults(results);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, recipes]);

  return (
    <div testID="container">
      <input testID="input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      <div testID="recipes">{recipes.length}</div>
      <div testID="youtube">{youtubeResults.length}</div>
    </div>
  );
};
