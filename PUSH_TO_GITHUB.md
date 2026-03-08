# Push NurseAda to GitHub

**"Repository not found"** usually means the GitHub repo does not exist yet or the URL/username is wrong. Follow these steps to create it and push.

---

## 1. Create the repository on GitHub

1. Go to **https://github.com/new**
2. **Repository name:** `NurseAda` (or any name you prefer)
3. **Description:** optional (e.g. "AI-powered primary care health assistant for Nigeria and Africa")
4. Choose **Public**
5. **Do not** check "Add a README", ".gitignore", or "License" (you already have these in the project)
6. Click **Create repository**

---

## 2. Push from this folder

This project has its own git repo and an initial commit. **Create the repo on GitHub first** (step 1), then open a terminal **in this folder** (`NurseAda 2`) and run:

```powershell
cd "c:\Users\Daug-PA\OneDrive\Documents\NurseAda 2"

# If your GitHub username is NOT "boarss", update the remote:
# git remote set-url origin https://github.com/YOUR_USERNAME/NurseAda.git

git push -u origin master
```

If your default branch is `main` instead of `master`, use: `git push -u origin main` (and optionally `git branch -M main` first).

---

## 3. If you're asked to sign in

- GitHub no longer accepts account passwords for git over HTTPS. Use either:
  - **Personal Access Token (PAT):** GitHub → Settings → Developer settings → Personal access tokens. Create a token with `repo` scope and use it as the password when git asks.
  - **GitHub CLI:** run `gh auth login` and follow the steps, then push again.

---

## 4. Keep the repo active

After the first push, use:

- `git add .`
- `git commit -m "Your message"`
- `git push`

whenever you want to update the code on GitHub.
