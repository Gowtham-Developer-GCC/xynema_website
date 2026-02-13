/**
 * Advanced State Management System
 * Centralized state with middleware, persistence, and devtools support
 */

/**
 * Action Types
 */
export const ActionTypes = {
  // Auth
  AUTH_LOGIN: 'AUTH_LOGIN',
  AUTH_LOGOUT: 'AUTH_LOGOUT',
  AUTH_REFRESH: 'AUTH_REFRESH',
  AUTH_ERROR: 'AUTH_ERROR',

  // Data
  SET_MOVIES: 'SET_MOVIES',
  SET_SHOWS: 'SET_SHOWS',
  SET_BOOKINGS: 'SET_BOOKINGS',
  SET_USER_PROFILE: 'SET_USER_PROFILE',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',

  // UI
  SET_FILTER: 'SET_FILTER',
  SET_SORT: 'SET_SORT',
  SET_PAGINATION: 'SET_PAGINATION',
  TOGGLE_MODAL: 'TOGGLE_MODAL',
  SET_THEME: 'SET_THEME',

  // Cache
  CACHE_DATA: 'CACHE_DATA',
  INVALIDATE_CACHE: 'INVALIDATE_CACHE',
};

/**
 * Initial State
 */
export const initialState = {
  // Auth
  auth: {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  },

  // Data
  movies: [],
  shows: [],
  bookings: [],
  userProfile: null,

  // UI
  ui: {
    loading: false,
    error: null,
    filter: {},
    sort: {},
    pagination: { page: 1, limit: 10 },
    theme: 'light',
    modals: {},
  },

  // Cache
  cache: {
    movies: { data: [], timestamp: null, ttl: 5 * 60 * 1000 },
    shows: { data: [], timestamp: null, ttl: 5 * 60 * 1000 },
    bookings: { data: [], timestamp: null, ttl: 2 * 60 * 1000 },
  },

  // Metadata
  metadata: {
    lastUpdated: null,
    requestCount: 0,
    errorCount: 0,
  },
};

/**
 * Reducer
 */
export const appReducer = (state, action) => {
  switch (action.type) {
    // Auth Actions
    case ActionTypes.AUTH_LOGIN:
      return {
        ...state,
        auth: {
          user: action.payload.user,
          token: action.payload.token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        },
        metadata: {
          ...state.metadata,
          lastUpdated: new Date().toISOString(),
        },
      };

    case ActionTypes.AUTH_LOGOUT:
      return {
        ...state,
        auth: initialState.auth,
        bookings: [],
        userProfile: null,
      };

    case ActionTypes.AUTH_ERROR:
      return {
        ...state,
        auth: {
          ...state.auth,
          error: action.payload,
          isLoading: false,
        },
      };

    // Data Actions
    case ActionTypes.SET_MOVIES:
      return {
        ...state,
        movies: action.payload,
        cache: {
          ...state.cache,
          movies: {
            data: action.payload,
            timestamp: Date.now(),
            ttl: state.cache.movies.ttl,
          },
        },
      };

    case ActionTypes.SET_SHOWS:
      return {
        ...state,
        shows: action.payload,
        cache: {
          ...state.cache,
          shows: {
            data: action.payload,
            timestamp: Date.now(),
            ttl: state.cache.shows.ttl,
          },
        },
      };

    case ActionTypes.SET_BOOKINGS:
      return {
        ...state,
        bookings: action.payload,
        cache: {
          ...state.cache,
          bookings: {
            data: action.payload,
            timestamp: Date.now(),
            ttl: state.cache.bookings.ttl,
          },
        },
      };

    case ActionTypes.SET_USER_PROFILE:
      return {
        ...state,
        userProfile: action.payload,
      };

    case ActionTypes.SET_LOADING:
      return {
        ...state,
        ui: {
          ...state.ui,
          loading: action.payload,
        },
      };

    case ActionTypes.SET_ERROR:
      return {
        ...state,
        ui: {
          ...state.ui,
          error: action.payload,
        },
        metadata: {
          ...state.metadata,
          errorCount: state.metadata.errorCount + 1,
        },
      };

    case ActionTypes.CLEAR_ERROR:
      return {
        ...state,
        ui: {
          ...state.ui,
          error: null,
        },
      };

    // UI Actions
    case ActionTypes.SET_FILTER:
      return {
        ...state,
        ui: {
          ...state.ui,
          filter: action.payload,
        },
      };

    case ActionTypes.SET_SORT:
      return {
        ...state,
        ui: {
          ...state.ui,
          sort: action.payload,
        },
      };

    case ActionTypes.SET_PAGINATION:
      return {
        ...state,
        ui: {
          ...state.ui,
          pagination: action.payload,
        },
      };

    case ActionTypes.SET_THEME:
      return {
        ...state,
        ui: {
          ...state.ui,
          theme: action.payload,
        },
      };

    case ActionTypes.TOGGLE_MODAL:
      return {
        ...state,
        ui: {
          ...state.ui,
          modals: {
            ...state.ui.modals,
            [action.payload.name]: action.payload.open,
          },
        },
      };

    // Cache Actions
    case ActionTypes.CACHE_DATA:
      return {
        ...state,
        cache: {
          ...state.cache,
          [action.payload.key]: {
            data: action.payload.data,
            timestamp: Date.now(),
            ttl: action.payload.ttl || state.cache[action.payload.key]?.ttl,
          },
        },
      };

    case ActionTypes.INVALIDATE_CACHE:
      return {
        ...state,
        cache: {
          ...state.cache,
          [action.payload]: {
            data: [],
            timestamp: null,
            ttl: state.cache[action.payload]?.ttl,
          },
        },
      };

    default:
      return state;
  }
};

/**
 * State Manager
 */
export class StateManager {
  constructor(initialState, reducer) {
    this.state = initialState;
    this.reducer = reducer;
    this.listeners = [];
    this.middleware = [];
    this.devtools = null;
  }

  /**
   * Get current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Dispatch action
   */
  dispatch(action) {
    // Run through middleware
    let finalAction = action;
    for (const mw of this.middleware) {
      finalAction = mw(finalAction, this.state);
    }

    // Reduce state
    const newState = this.reducer(this.state, finalAction);

    if (newState !== this.state) {
      this.state = newState;
      this._notifyListeners(finalAction, newState);

      // Send to devtools
      if (this.devtools) {
        this.devtools.send(finalAction, newState);
      }
    }
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Add middleware
   */
  addMiddleware(middleware) {
    this.middleware.push(middleware);
  }

  /**
   * Connect devtools
   */
  connectDevtools(devtoolsExtension) {
    this.devtools = devtoolsExtension();
  }

  /**
   * Notify listeners
   */
  _notifyListeners(action, newState) {
    this.listeners.forEach(listener => listener(action, newState));
  }

  /**
   * Reset state
   */
  reset() {
    this.state = { ...initialState };
    this._notifyListeners({ type: 'RESET' }, this.state);
  }

  /**
   * Batch updates
   */
  batch(actions) {
    actions.forEach(action => this.dispatch(action));
  }
}

/**
 * Middleware
 */
export const createLoggingMiddleware = () => (action, state) => {
  console.log('[Action]', action.type, action.payload);
  return action;
};

export const createCacheInvalidationMiddleware = () => (action, state) => {
  // Invalidate related caches
  const invalidationMap = {
    AUTH_LOGIN: ['shows', 'bookings'],
    AUTH_LOGOUT: ['bookings', 'movies', 'shows'],
    SET_MOVIES: [],
  };

  if (invalidationMap[action.type]) {
    console.log('[Cache] Invalidating:', invalidationMap[action.type]);
  }

  return action;
};

export const createPersistenceMiddleware = (storageKey = 'appState') => (action, state) => {
  const persistableActions = [
    ActionTypes.AUTH_LOGIN,
    ActionTypes.SET_FILTER,
    ActionTypes.SET_SORT,
    ActionTypes.SET_THEME,
  ];

  if (persistableActions.includes(action.type)) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('[Persistence] Failed to save state:', error);
    }
  }

  return action;
};

/**
 * Selectors
 */
export const selectors = {
  getAuthUser: (state) => state.auth.user,
  isAuthenticated: (state) => state.auth.isAuthenticated,
  getMovies: (state) => state.movies,
  getShows: (state) => state.shows,
  getBookings: (state) => state.bookings,
  getLoading: (state) => state.ui.loading,
  getError: (state) => state.ui.error,
  getTheme: (state) => state.ui.theme,
  getFilter: (state) => state.ui.filter,
  getSort: (state) => state.ui.sort,
  getPagination: (state) => state.ui.pagination,

  // Computed
  getFilteredMovies: (state) => {
    let filtered = state.movies;

    if (state.ui.filter.genre) {
      filtered = filtered.filter(m => m.genre === state.ui.filter.genre);
    }
    if (state.ui.filter.language) {
      filtered = filtered.filter(m => m.language === state.ui.filter.language);
    }
    if (state.ui.filter.rating) {
      filtered = filtered.filter(m => m.rating >= state.ui.filter.rating);
    }

    return filtered;
  },

  getBookingStats: (state) => ({
    total: state.bookings.length,
    confirmed: state.bookings.filter(b => b.status === 'confirmed').length,
    cancelled: state.bookings.filter(b => b.status === 'cancelled').length,
    pending: state.bookings.filter(b => b.status === 'pending').length,
  }),

  isCacheValid: (state, key) => {
    const cache = state.cache[key];
    if (!cache || !cache.timestamp) return false;
    return Date.now() - cache.timestamp < cache.ttl;
  },
};

/**
 * Create Store
 */
export const createStore = () => {
  const store = new StateManager(initialState, appReducer);

  // Add middleware
  store.addMiddleware(createLoggingMiddleware());
  store.addMiddleware(createCacheInvalidationMiddleware());
  store.addMiddleware(createPersistenceMiddleware());

  // Load persisted state
  try {
    const saved = localStorage.getItem('appState');
    if (saved) {
      const persistedState = JSON.parse(saved);
      store.state = { ...initialState, ...persistedState };
    }
  } catch (error) {
    console.error('[Persistence] Failed to load state:', error);
  }

  return store;
};

export default {
  ActionTypes,
  initialState,
  appReducer,
  StateManager,
  selectors,
  createStore,
  createLoggingMiddleware,
  createCacheInvalidationMiddleware,
  createPersistenceMiddleware,
};
