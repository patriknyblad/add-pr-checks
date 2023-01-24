# Add PR Checks

Allows you to collect PR status checks from a defined directory as a post step in your build. The action 
does this by scanning a folder for YAML and JSON files. All files will be iterated through to create 
**one** check per file.

![checks-in-action](https://github.com/patriknyblad/add-pr-checks/blob/main/checks.png)

# Why?

Aren't you also tired of all the bot comments on PRs that you have to scroll past? The comments section 
is for humans to discuss the contents of the PR, allowing bots into this space just creates noise and 
forces reviewers and the creator of the PR to scroll past useless bot comments saying "All good, no 
tests failed" or even big comments containing code coverage reports etc.

These types of metrics or build statuses for a PR should still be visible and they already have a 
dedicated area down at the bottom called "Checks".

You might think that is's already easy to add checks to the bottom by adding more actions to your 
workflow but what if you can't find the action you are looking for or don't want to create a whole 
action from scratch just to get all your statuses to show up? This is why this action exists, you just 
bother creating a `checks.(yaml|json)` file and this action will make sure to make it visible. 
Better yet, make multiple files and they will all be listed as separate checks.

Some ideas:
- Code coverage
- App install size
- Number of modules
- Number of lint warnings/errors
- Download link with QR code to the artifact/app built by CI

# Inputs

- `token`: Your Github API token. Recommended to use as a secret ${{ secrets.GITHUB_TOKEN }}
- `checks-path`: (optional) The path to where you are generating all the checks YAML/JSON files in your build, this supports glob patterns.
- `checks`: (optional) An array of checks you want to add to the PR directly from your workflow.

# Check file format

The `checks-path` can contain a mix of YAML or JSON files, each file should represent a single Github 
"check" to be added.

**Format**
```yaml
# String
name: The name of your check (same as `name` in the github checks API docs)
# String
value: Written directly after the name of the check in the bottom of the PR. (mapped to `title` in the github checks API docs)
# String
summary: |
  Markdown compatible text field (same as `output.summary` in the github checks API docs)
# String?
text: |
  Optional markdown compatible text field (same as `output.text` in the github checks API docs)
```

**Example:**
*app-size.yaml*
```yaml
name: Estimated App Size
value: 116MB
summary: |
  # Estimated app download size
text: |
  This size is just and estimation and is the result of **compressing** the build output and measuring the 
  size. It should be fairly close to the size reported on the store.
```

For more examples see `sample-checks/` in the [Github Repository](https://github.com/patriknyblad/add-pr-checks/blob/main/sample-checks).

# Usage

```yaml
- uses: patriknyblad/add-pr-checks@v1.0.0
  with:
    # Your Github API token. Recommended to use as a secret ${{ secrets.GITHUB_TOKEN }} 
    token: ${{ secrets.GITHUB_TOKEN }} 

    # The path to where you are generating all the checks YAML/JSON files in your build, this supports glob patterns.
    checks-path: '**/.checks'

    # An array of checks you want to add to the PR directly from your workflow.
    checks: 
      - name: Estimated App Size
        value: 116MB
        summary: |
          # Estimated app download size
        text: |
          This size is just and estimation and is the result of **compressing** the build output and measuring the 
          size. It should be fairly close to the size reported on the store.
      - name: App download QR code
        value: See details
        summary: |
          ![QR-Code](https://example.com/qr-code)
```