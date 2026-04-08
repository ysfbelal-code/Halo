const STORAGE_KEYS = {
  reports: "mock_reports",
  customFilters: "mock_customFilters",
  user: "mock_user",
};

function getStore(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function setStore(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function genId() {
  return "mock_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
}

function getDefaultUser() {
  return {
    id: "mock_user_1",
    name: "Test Parent",
    email: "parent@test.com",
    role: "admin",
    filter_level: "basic",
    youtube_channel: "",
  };
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.user)) || getDefaultUser();
  } catch {
    return getDefaultUser();
  }
}

function seedIfEmpty() {
  if (getStore(STORAGE_KEYS.reports).length === 0) {
    setStore(STORAGE_KEYS.reports, [
      {
        id: genId(),
        title: "Skibidi video slipped through",
        description: "My child saw a skibidi toilet video on their For You page.",
        video_url: "https://youtube.com/watch?v=example1",
        category: "inappropriate_content",
        status: "resolved",
        created_date: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: genId(),
        title: "Dangerous parkour challenge",
        description: "A rooftop parkour video appeared in the feed.",
        video_url: "https://youtube.com/watch?v=example2",
        category: "risky_stunts",
        status: "reviewing",
        created_date: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: genId(),
        title: "Blind date challenge for kids",
        description: "A blind date challenge video targeting young viewers.",
        video_url: "",
        category: "social_engineering",
        status: "pending",
        created_date: new Date().toISOString(),
      },
    ]);
  }

  if (getStore(STORAGE_KEYS.customFilters).length === 0) {
    setStore(STORAGE_KEYS.customFilters, [
      { id: genId(), keyword: "skibidi", category: "brainrot", is_active: true, created_date: new Date().toISOString() },
      { id: genId(), keyword: "fanum tax", category: "brainrot", is_active: true, created_date: new Date().toISOString() },
      { id: genId(), keyword: "blind date", category: "social_engineering", is_active: false, created_date: new Date().toISOString() },
    ]);
  }
}

seedIfEmpty();

const mockBase44 = {
  auth: {
    me: async () => {
      await new Promise((r) => setTimeout(r, 400));
      return getUser();
    },
    updateMe: async (data) => {
      await new Promise((r) => setTimeout(r, 500));
      const user = getUser();
      const updated = { ...user, ...data };
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(updated));
      return updated;
    },
    logout: (redirectUrl) => {
      localStorage.removeItem(STORAGE_KEYS.user);
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    },
    redirectToLogin: (returnUrl) => {
      console.log("[Mock] Would redirect to login, returnUrl:", returnUrl);
    },
  },
  entities: {
    Report: {
      list: async (sort) => {
        await new Promise((r) => setTimeout(r, 300));
        const reports = getStore(STORAGE_KEYS.reports);
        if (sort && sort.startsWith("-")) {
          const field = sort.slice(1);
          return [...reports].sort((a, b) => {
            if (a[field] < b[field]) return 1;
            if (a[field] > b[field]) return -1;
            return 0;
          });
        }
        return reports;
      },
      create: async (data) => {
        await new Promise((r) => setTimeout(r, 400));
        const report = {
          id: genId(),
          ...data,
          status: data.status || "pending",
          created_date: new Date().toISOString(),
        };
        const reports = getStore(STORAGE_KEYS.reports);
        reports.push(report);
        setStore(STORAGE_KEYS.reports, reports);
        return report;
      },
    },
    CustomFilter: {
      list: async (sort) => {
        await new Promise((r) => setTimeout(r, 300));
        const filters = getStore(STORAGE_KEYS.customFilters);
        if (sort && sort.startsWith("-")) {
          const field = sort.slice(1);
          return [...filters].sort((a, b) => {
            if (a[field] < b[field]) return 1;
            if (a[field] > b[field]) return -1;
            return 0;
          });
        }
        return filters;
      },
      create: async (data) => {
        await new Promise((r) => setTimeout(r, 400));
        const filter = {
          id: genId(),
          ...data,
          created_date: new Date().toISOString(),
        };
        const filters = getStore(STORAGE_KEYS.customFilters);
        filters.push(filter);
        setStore(STORAGE_KEYS.customFilters, filters);
        return filter;
      },
      update: async (id, data) => {
        await new Promise((r) => setTimeout(r, 300));
        const filters = getStore(STORAGE_KEYS.customFilters);
        const idx = filters.findIndex((f) => f.id === id);
        if (idx === -1) throw new Error("Filter not found");
        filters[idx] = { ...filters[idx], ...data };
        setStore(STORAGE_KEYS.customFilters, filters);
        return filters[idx];
      },
      delete: async (id) => {
        await new Promise((r) => setTimeout(r, 300));
        const filters = getStore(STORAGE_KEYS.customFilters);
        const filtered = filters.filter((f) => f.id !== id);
        setStore(STORAGE_KEYS.customFilters, filtered);
        return { success: true };
      },
    },
  },
  integrations: {
    Core: {
      SendEmail: async (data) => {
        await new Promise((r) => setTimeout(r, 600));
        console.log("[Mock Email]", data);
        return { success: true };
      },
    },
  },
};

export const base44 = mockBase44;
