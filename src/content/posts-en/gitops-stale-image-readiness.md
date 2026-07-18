---
title: "A GitOps deadlock between a new readiness probe and an old image"
description: "GitHub redirected the repository but not the GHCR coordinate, so Argo CD combined a new /ready probe with an image that could only return 404."
publishedAt: 2026-07-18
category: troubleshooting
activity: personal-project
tags: ["Argo CD", "GitOps", "Kubernetes", "GHCR"]
project: ssu-platform
role: "Diagnosed the ssu-ai-service rollout, restored the Argo Application source of truth, and verified the live image and readiness"
evidence:
  - "The stale ArgoCD owner incident in ssu-ai-service docs/deployment-troubleshooting"
  - "Image Updater showing one matched application and zero considered images, correlated with the live Application and Pod image"
validation:
  - "The exact image SHA, 1/1 Ready Pod with zero restarts, and Argo Synced/Healthy"
  - "200 from /health and /ready, 401 for invalid API keys, and an authenticated 768-dimensional embedding"
limitations:
  - "RollingUpdate retained the previous Ready Pod, so this single-replica transition caused no external outage"
  - "The stale operation was terminated only after the latest Git revision and corrected image were verified"
  - "A Git repository redirect does not rename coordinates in an independent artifact registry"
featured: true
draft: false
---

## CI and source sync succeeded, but the new image was never selected

ssu-ai-service separated `/health` liveness from fail-closed `/ready` readiness. The pull request passed tests and published an ARM64 image under the new GitHub owner's GHCR namespace. The Helm probe changed to `/ready`.

The Argo CD Application still referenced the previous repository owner, but GitHub's redirect let it fetch the new chart. Its Image Updater annotation also referenced the old `ghcr.io` coordinate. Registry names are independent of repository redirects, so the updater could not discover the image published under the new owner.

```text
Git source       old owner URL -> GitHub redirect -> new chart synced
image annotation old GHCR owner -> no matching new image
live rollout     new /ready probe + old image -> 404
```

Image Updater matched one Application but considered zero images. Argo applied the new probe to an old image that did not implement `/ready`, and every replacement Pod returned 404.

## Two sources of truth had diverged

I initially investigated FastAPI router registration and readiness implementation. The newly built image did contain the endpoint; the live Pod digest showed that it was not running that image. Treating source-code relocation and OCI artifact naming as one redirectable identity was the actual mistake.

I corrected both the repository URL and image-list owner in the version-controlled Application manifest. Image Updater then selected the new SHA and wrote the Helm value, but the rollout still did not recover. An earlier Argo operation remained blocked waiting for the old-image Deployment to pass a probe it could never serve, preventing reconciliation of the newer revision.

## I terminated only the impossible operation

First I verified that the corrected image existed, the Git value referenced its SHA, and the Application source of truth contained the current owner. Only then did I terminate the stale operation and request a hard refresh. I did not delete the Application or Deployment.

RollingUpdate kept the previous Ready Pod serving traffic while new Pods failed. The old Pod was removed only after a replacement running the corrected image passed `/ready`, so the incident caused no external outage.

## Completion ended at the running artifact

The final verification connected every layer:

- the Deployment image equaled the exact SHA produced by CI;
- the Pod was 1/1 Ready with zero restarts;
- Argo CD was Synced/Healthy on the same revision;
- `/health` and `/ready` returned 200;
- missing or invalid `X-API-Key` returned 401;
- a valid authenticated request returned a 768-dimensional embedding.

The [deployment troubleshooting record](https://github.com/ghdtjdwn/ssu-ai-service/blob/main/docs/deployment-troubleshooting.md) preserves the CI evidence, live image, and recovery order.

This was not one GitOps tool failing. Git source, the image registry, and the updater each used a different identifier, and a redirect repaired only one of them. Deployment verification must therefore correlate source revision, selected artifact, and live digest rather than stop at a successful sync.
