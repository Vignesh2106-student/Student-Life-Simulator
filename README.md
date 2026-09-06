# 🎓 Student Life Simulator

Student Life Simulator is a web-based college life simulation game where players experience a student's 100-day semester. The goal is to make smart daily decisions while balancing academics, health, happiness, sleep, energy, social life, and money.

## 🎮 About the Project

College life is all about making choices and managing limited resources. In this game, the player takes the role of a college student and makes different decisions throughout a 100-day semester.

Every activity affects the student's overall life statistics. The player must balance different aspects of student life to achieve the best possible outcome by the end of the semester.

## ✨ Features

* 🎓 **Academics** – Manage academic performance through daily decisions.
* ❤️ **Health** – Maintain a healthy lifestyle.
* 😊 **Happiness** – Keep the student's happiness level balanced.
* 😴 **Sleep** – Manage sleep and avoid unhealthy routines.
* ⚡ **Energy** – Use energy wisely throughout the day.
* 👥 **Social Life** – Build and maintain social activities.
* 💰 **Money** – Manage the student's available money.
* 📅 **100-Day Semester** – Experience college life across 100 simulated days.
* 🎯 **Daily Activities** – Choose different activities that affect the student's statistics.
* 📊 **Progress Tracking** – Monitor the student's performance and resources.
* 🏆 **Results** – View the final outcome of the semester.

## 🛠️ Technologies Used

* **HTML5** – Structure and pages
* **CSS3** – Styling and responsive design
* **JavaScript** – Game logic and interactivity
* **Git** – Version control
* **GitHub** – Source code management and collaboration
* **Jenkins** – Continuous Integration and automated builds

## 📂 Project Structure

```text
Student-Life-Simulator/
│
├── index.html          # Home page
├── login.html          # Login page
├── game.html           # Main game page
├── activities.html     # Activities page
├── results.html        # Final results page
├── style.css           # Website styling
├── script.js           # Game logic and interactivity
└── README.md           # Project documentation
```

## 🚀 How to Run

No server or additional installation is required.

### 1. Clone the repository

```bash
git clone https://github.com/Vignesh2106-student/Student-Life-Simulator.git
```

### 2. Open the project folder

```bash
cd Student-Life-Simulator
```

### 3. Run the application

Open `index.html` in a web browser.

You can also use a local development server such as VS Code Live Server.

## 🎯 How to Play

1. Open the application.
2. Start the student simulation.
3. Progress through the 100-day semester.
4. Choose activities each day.
5. Monitor academics, health, happiness, sleep, energy, social life, and money.
6. Make decisions carefully because each choice affects the student's overall progress.
7. Complete the semester and view the final results.

## 🔀 Git & GitHub Workflow

This project uses Git and GitHub for source code management.

The team works using feature branches:

```text
main
│
├── feature/home-login
├── feature/game
├── feature/activities
├── feature/results
└── feature/jenkins-test
```

Development workflow:

```text
Create Feature Branch
        ↓
Develop / Modify Files
        ↓
Commit Changes
        ↓
Push Feature Branch
        ↓
Create Pull Request
        ↓
Code Review
        ↓
Approval
        ↓
Merge into main
```

## 👥 Team Collaboration

The project is divided among team members so that different features/pages can be developed independently.

Each member:

* Works on a separate feature branch.
* Commits changes locally.
* Pushes the feature branch to GitHub.
* Creates a Pull Request.
* Gets the changes reviewed.
* Merges approved changes into `main`.

## ⚙️ Jenkins CI

Jenkins is integrated with the GitHub repository for Continuous Integration.

The Jenkins job:

* Retrieves the latest code from the `main` branch.
* Checks the required project files.
* Runs automatically when changes are detected.
* Reports the build status as **SUCCESS** or **FAILURE**.

The project uses Jenkins Poll SCM to periodically check the GitHub repository for new changes.

Example polling schedule:

```text
H/5 * * * *
```

This allows Jenkins to automatically detect changes merged into the `main` branch and start a new build.

## 📌 Project Goals

The main goals of this project are:

* To create an interactive college-life simulation.
* To demonstrate frontend web development.
* To practice Git and GitHub collaboration.
* To demonstrate feature branches and Pull Requests.
* To demonstrate code review and merging.
* To demonstrate Jenkins Continuous Integration.

## 📄 License

This project is developed for educational and academic purposes.
