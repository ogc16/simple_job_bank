# Architecture & UML

The portal is a set of static HTML pages sharing a hand-written JavaScript
"design system" of pure rules and thin DOM wiring. These diagrams are authored
in [Mermaid](https://mermaid.js.org) and render on GitHub automatically.

## Class diagram — data model

```mermaid
classDiagram
    class Job {
        +string title
        +string company
        +string icon
        +string[] categories
        +number salaryMin
        +number salaryMax
        +number postedDays
        +string type
        +string location
        +string level
        +boolean dashboard
    }

    class FilterCriteria {
        +string query
        +string category
        +string location
        +string salary
        +number maxDays
        +string[] tags
    }

    class ApplicationEntry {
        +number jobIndex
        +number stage
        +number appliedDays
    }

    class Stage {
        +string label
        +string badge
        +number segIdx
    }

    class JobUtils
    JobUtils : +filterJobs(Job[], FilterCriteria) Job[]
    JobUtils : +validateJobs(Job[]) string[]
    JobUtils : +renderCard(Job, string) string
    JobUtils : +computeStats(ApplicationEntry[], number) stats
    JobUtils : +buildApplicationsCsv(ApplicationEntry[], Job[], Stage[]) string
    JobUtils : +debounce(Function, number) Function
    JobUtils : +toggleTag(string[], string) string[]

    ApplicationEntry --> Job : references (jobIndex)
    JobUtils --> Job : rules operate on
    JobUtils --> FilterCriteria : input to filterJobs
    JobUtils --> ApplicationEntry : input to stats/CSV
    JobUtils --> Stage : input to CSV
```

## Component diagram — pages, scripts, and data flow

```mermaid
flowchart LR
    subgraph Pages
        INDEX[index.html]
        DASH[pages/dashboard.html]
        JOBS[pages/jobs.html]
        OTHER[all other pages]
    end

    subgraph Scripts
        UTILS[js/lib/job-utils.js]
        DATA[js/jobs.js]
        FILTERS[js/job-filters.js]
        DASHJS[js/dashboard.js]
        NAV[js/layout.js]
    end

    subgraph Tests
        HELPER[tests/helpers/load-script.js]
        UTEST[tests/job-utils.test.js]
        DTEST[tests/jobs-data.test.js]
    end

    STYLES[css/style.css]
    FONTS[Font Awesome via cdnjs]

    INDEX --> UTILS
    INDEX --> DATA
    INDEX --> FILTERS
    INDEX --> NAV
    DASH --> UTILS
    DASH --> DATA
    DASH --> FILTERS
    DASH --> DASHJS
    DASH --> NAV
    JOBS --> UTILS
    JOBS --> DATA
    JOBS --> FILTERS
    JOBS --> NAV
    OTHER --> NAV

    FILTERS --> UTILS
    DASHJS --> UTILS
    FILTERS --> DATA
    DASHJS --> DATA

    INDEX --> STYLES
    DASH --> STYLES
    JOBS --> STYLES
    DASH --> FONTS
    INDEX --> FONTS

    UTEST --> HELPER
    DTEST --> HELPER
    HELPER -. loads in vm sandbox .-> UTILS
    HELPER -. loads in vm sandbox .-> DATA
```

## Sequence diagram — filtering a job list

```mermaid
sequenceDiagram
    actor User
    participant Page as jobs.html / dashboard.html
    participant JS as job-filters.js
    participant Utils as job-utils.js
    participant DOM as job-list element

    User->>Page: types in #job-search / changes a select / taps a chip
    Page->>JS: input / change / click event
    JS->>JS: debounce (250 ms) or immediate dispatch
    JS->>Utils: filterJobs(JOBS, { query, category, location, salary, maxDays, tags })
    Utils-->>JS: Job[] (matching)
    loop each matching job
        JS->>Utils: renderCard(job, JOB_DETAILS_HREF)
        Utils-->>JS: <a class="job_card">…</a>
    end
    JS->>DOM: innerHTML / count / empty-state toggle
    DOM-->>User: rendered cards update
```

## State diagram — renderer bootstrap modes

```mermaid
stateDiagram-v2
    [*] --> Run: page script loads
    Run --> FilterPage: #job-search + #job-list present
    Run --> FeaturedPage: #featured-jobs present
    Run --> [*] : neither present (bail out)
    FilterPage --> [*] : skeleton 350 ms then applyFilters
    FeaturedPage --> [*] : top 3 most recent jobs
```

## Activity diagram — adding a job

```mermaid
flowchart TD
    A[Open js/jobs.js] --> B[Append object to JOBS array]
    B --> C{Fields valid?}
    C -- yes --> D[Renderer + badges + filters update automatically]
    C -- no --> E[tests/jobs-data.test.js fails]
    E --> F[Fix fields to match Job schema]
    F --> C
    D --> G[node --test and tsc pass]
```