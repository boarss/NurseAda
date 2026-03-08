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

## 2. Set the correct remote and push

Open a terminal in this folder (`NurseAda 2`) and run:

```powershell
# If your GitHub username is NOT "boarss", set it here:
$GITHUB_USER = "boarss"   # <-- Change to your GitHub username

# Set the remote to your new repo (use the URL GitHub shows after creating the repo)
git remote remove origin 2>$null
git remote add origin "https://github.com/$GITHUB_USER/NurseAda.git"

# Push (use "main" if your branch is main, or "master" if that's what you have)
git push -u origin master
```

If GitHub shows you a different URL (e.g. with your username), use that exact URL in `git remote add origin ...`.

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
