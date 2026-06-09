This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Testing

``` bash
npm run test # unit tests
npm run test:e2e # e2e tests
```

## Setup Decisions
Technology Stack: 
Next.js 15 (App Router) · React 19 · TypeScript · Prisma 7 · SQLite (better-sqlite3) · Tailwind CSS v4 · Base UI · shadcn/ui

When undertaking this project, I had a SPA style implementation in mind. Since the application was meant to be "lite" full-stack application, React seemed like the appropriate JS library for the frontend due to its speed, responsiveness, and memoization capabilities. Additionally, dependencies like React Hook Forms made it easy to handle the form-heavy parts of the application such as creating patients and building orders.

I chose Next.js to handle the app routing and controller logic. I believe this choice to be an industry standard for an application like this. Better to not reinvent the wheel either.

Typescript was chosen over raw JS for maintainability and scalability reasons. Even though this project is small, I chose Typescript with the future in mind. 

SQLite and Prisma 7 persist data locally. This is sufficient since this app will not be deployed.

Tailwind, Base UI, and shadcn/ui are a part of this project to help speed up frontend development.


## Design Choices
The design choices were made with home caregivers in mind. This could mean they're on the go and may not have access to a computer or tablet. Responsiveness, speed, and ease of navigation were priority for the user experience. A React frontend supports this paradigm.

Most of the important information is kept centered on the screen in table format. Child elements on screen are kept in a container element to help with responsiveness. If a caregiver needs to access the application via mobile device, then it should be easy to navigate.

Fast access to patients and their order details are critical in this application. There's an implied hierarchy baked into the design of this application. This design follows a patient-first navigation hierarchy.


## Architecture and Decisions
* Repository pattern
* ORM pattern
* Guard clause pattern
* Result object pattern

* Types flow from schema outward (follows DRY principle)
* Server/client split
* Separation of concerns enforced through strict layering of responsibility
    * prisma owns the data shape
    * actions owns db access and mutation logic
    * components own rendering

Usage of Typescript, styling libraries, component libraries, and routing framework with maintainability and scalability in mind. Overkill for small projects, but will be good if the end goal is a large-scale or enterprise application.

The file structure follows a domain-first folder oganization instead of by type. Instead of having a folder for forms, tables, dialogs, etc... Everything related to orders will be under /orders and everything related to patients will be under /patients.


## Known Limitations
* No user authorization. Permissions hierarchy is implied.
* Concurrent users not allowed since application is local.
* Search is crude
* Nature of application does not allow framework to really take advantage of reactive programming
* Plenty of dummy data

What could have been improved with more time:
* More robust form validation
* Data masking to protect PII
* User preferences (such as commonly ordered tests, patient visits, etc.)
* Pagination
* Audit trails
* Automation data calculations

## Tradeoffs
* Lack of security in the application. Some security should have been added, but more time and effort was put into enhancing the user experience.
* No exporting or reporting functionality. This is assumed that sensitive data stays within the application. Additionally, the stack is chosen in mind for mobile usage.
* No notification system. Scope cut here in user experience because the user experience was mostly with the home caregiver in mind. This may have been a priority if the user experience was more about the patient.

