const githubUsername = 'NAScherba71';
const githubApiBase = 'https://api.github.com';

interface GithubProfile {
  avatar_url?: string;
  bio?: string;
  followers?: number;
  following?: number;
  html_url?: string;
  location?: string;
  name?: string;
  public_repos?: number;
}

interface GithubRepo {
  id: number;
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  homepage: string | null;
  fork: boolean;
}

async function fetchGithubProfile(): Promise<GithubProfile | null> {
  try {
    const response = await fetch(`${githubApiBase}/users/${githubUsername}`, {
      headers: {
        Accept: 'application/vnd.github+json',
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as GithubProfile;
  } catch (error) {
    console.error('Failed to load GitHub profile', error);
    return null;
  }
}

async function fetchGithubRepos(): Promise<GithubRepo[]> {
  const repos: GithubRepo[] = [];

  for (let page = 1; page <= 5; page += 1) {
    try {
      const response = await fetch(
        `${githubApiBase}/users/${githubUsername}/repos?per_page=100&page=${page}&sort=updated`,
        {
          headers: {
            Accept: 'application/vnd.github+json',
          },
          next: { revalidate: 3600 },
        },
      );

      if (!response.ok) {
        break;
      }

      const data = (await response.json()) as GithubRepo[];
      if (data.length === 0) {
        break;
      }

      repos.push(...data);

      if (data.length < 100) {
        break;
      }
    } catch (error) {
      console.error('Failed to load GitHub repositories', error);
      break;
    }
  }

  return repos;
}

function formatUpdatedDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function DeveloperPage() {
  const [profile, repos] = await Promise.all([fetchGithubProfile(), fetchGithubRepos()]);
  const sortedRepos = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-4">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-500">Персональная страница</p>
              <h1 className="text-4xl font-bold text-slate-900">{profile?.name ?? githubUsername}</h1>
              <p className="text-lg text-slate-600 max-w-2xl">
                {profile?.bio
                  ? profile.bio
                  : 'Здесь собраны все проекты разработчика на GitHub, включая описание, язык, количество звёзд и ссылки.'}
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                {profile?.location && (
                  <span className="rounded-full bg-slate-100 px-3 py-1">📍 {profile.location}</span>
                )}
                <span className="rounded-full bg-slate-100 px-3 py-1">Репозитории: {profile?.public_repos ?? repos.length}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1">Подписчики: {profile?.followers ?? '—'}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1">Подписки: {profile?.following ?? '—'}</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href={profile?.html_url ?? `https://github.com/${githubUsername}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
                >
                  Перейти в профиль GitHub
                </a>
                <a
                  href={`https://github.com/${githubUsername}?tab=repositories`}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400"
                >
                  Все репозитории
                </a>
              </div>
            </div>
            <div className="flex-shrink-0">
              <img
                src={profile?.avatar_url ?? 'https://avatars.githubusercontent.com/u/0?v=4'}
                alt={`Аватар ${githubUsername}`}
                className="h-32 w-32 rounded-2xl border border-slate-200 object-cover shadow-lg"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <section>
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Проекты разработчика</h2>
              <p className="text-slate-600">
                Полный список репозиториев из аккаунта {githubUsername} с прямыми ссылками.
              </p>
            </div>
            <span className="text-sm text-slate-500">Всего проектов: {repos.length}</span>
          </div>

          <div className="mt-8 grid gap-6">
            {sortedRepos.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
                Репозитории не найдены или GitHub API временно недоступен.
              </div>
            ) : (
              sortedRepos.map((repo) => (
                <article
                  key={repo.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-semibold text-slate-900">{repo.name}</h3>
                        {repo.fork && (
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                            Fork
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-slate-600">
                        {repo.description ?? 'Описание проекта пока не добавлено.'}
                      </p>
                    </div>
                    <div className="flex flex-col items-start gap-2 text-sm text-slate-500">
                      <span>⭐ {repo.stargazers_count}</span>
                      <span>🍴 {repo.forks_count}</span>
                      <span>Обновлено: {formatUpdatedDate(repo.updated_at)}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                    {repo.language && <span className="rounded-full bg-slate-100 px-3 py-1">{repo.language}</span>}
                    <a
                      href={repo.html_url}
                      className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 font-semibold text-indigo-600 hover:bg-indigo-100"
                    >
                      Открыть репозиторий
                    </a>
                    {repo.homepage && (
                      <a
                        href={repo.homepage}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 hover:border-slate-300"
                      >
                        Демо/сайт
                      </a>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
