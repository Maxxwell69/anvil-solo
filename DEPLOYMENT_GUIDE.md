# Anvil Bot Deployment Guide (GKE with Helm)

This guide outlines the steps to deploy the Anvil Bot application (including `bot` service, `swap` service, MongoDB, and RabbitMQ) to Google Kubernetes Engine (GKE) using the provided Helm chart.

## Prerequisites

1.  **Google Cloud Account & Project:** You need a Google Cloud account with billing enabled and a project created.
2.  **`gcloud` CLI:** Install and configure the [Google Cloud CLI](https://cloud.google.com/sdk/docs/install). Authenticate with your account (`gcloud auth login`) and set your project (`gcloud config set project YOUR_PROJECT_ID`).
3.  **`kubectl`:** Install the [Kubernetes command-line tool](https://kubernetes.io/docs/tasks/tools/install-kubectl/). Configure it to connect to your GKE cluster (this is often done automatically after cluster creation or via `gcloud container clusters get-credentials`).
4.  **`helm`:** Install [Helm v3+](https://helm.sh/docs/intro/install/).
5.  **Docker:** Install [Docker](https://docs.docker.com/get-docker/) for building container images. Ensure the Docker daemon is running.
6.  **GKE Cluster:** Create a GKE cluster in your Google Cloud project. Ensure it has sufficient node resources for MongoDB, RabbitMQ, and your application services.
7.  **Container Registry:** You need a container registry to store your Docker images. Google Artifact Registry (GAR) is recommended, but Google Container Registry (GCR) or Docker Hub can also be used. Ensure your GKE cluster nodes have permission to pull images from your chosen registry. Configure Docker to authenticate with your registry (e.g., `gcloud auth configure-docker REGION-docker.pkg.dev` for GAR).

## Deployment Steps

### 1. Configure Helm Chart Values

*   Navigate to the `anvil-bot-chart` directory.
*   Open the `values.yaml` file.
*   **Crucially, update the following placeholder values:**
    *   `bot.image.repository`: Set to your container registry path for the bot service (e.g., `us-central1-docker.pkg.dev/YOUR_PROJECT_ID/anvil-bot/bot-service`).
    *   `bot.image.tag`: Set the desired image tag (e.g., `v1.0.0`, `latest`).
    *   `swap.image.repository`: Set to your container registry path for the swap service (e.g., `us-central1-docker.pkg.dev/YOUR_PROJECT_ID/anvil-bot/swap-service`).
    *   `swap.image.tag`: Set the desired image tag.
    *   `bot.secrets.telegramBotToken`: **(Sensitive)** Provide your actual Telegram Bot Token.
    *   `bot.secrets.solanaRpcUrl`: Provide the Solana RPC endpoint URL.
    *   `swap.secrets.solanaWalletPrivateKey`: **(Highly Sensitive)** Provide the private key for the Solana wallet used by the swap service.
    *   `mongodb.auth.rootPassword`: **(Sensitive)** Set a strong password for the MongoDB root user.
    *   `mongodb.auth.passwords`: **(Sensitive)** Set a strong password for the `anvil_bot_user`.
    *   `rabbitmq.auth.password`: **(Sensitive)** Set a strong password for the `anvil_bot_mq_user`.
*   Review other configuration options in `values.yaml` (replica counts, resources, persistence settings for MongoDB/RabbitMQ) and adjust as needed for your environment.

**Security Note:** For production deployments, avoid storing sensitive values directly in `values.yaml`. Use Helm's `--set` flag, separate values files excluded from version control (`helm install ... -f secrets.yaml`), or integrate with a secrets management solution like Google Secret Manager or HashiCorp Vault.

### 2. Build and Push Docker Images

*   Navigate to the `bot` service directory (`cd ../bot`).
*   Build the Docker image, tagging it according to the `repository` and `tag` set in `values.yaml`:
    ```bash
    docker build -t YOUR_REGISTRY_PATH/bot-service:YOUR_TAG .
    # Example: docker build -t us-central1-docker.pkg.dev/my-gcp-project/anvil-bot/bot-service:v1.0.0 .
    ```
*   Push the image to your container registry:
    ```bash
    docker push YOUR_REGISTRY_PATH/bot-service:YOUR_TAG
    # Example: docker push us-central1-docker.pkg.dev/my-gcp-project/anvil-bot/bot-service:v1.0.0
    ```
*   Navigate to the `swap` service directory (`cd ../swap`).
*   Build the Docker image:
    ```bash
    docker build -t YOUR_REGISTRY_PATH/swap-service:YOUR_TAG .
    # Example: docker build -t us-central1-docker.pkg.dev/my-gcp-project/anvil-bot/swap-service:v1.0.0 .
    ```
*   Push the image:
    ```bash
    docker push YOUR_REGISTRY_PATH/swap-service:YOUR_TAG
    # Example: docker push us-central1-docker.pkg.dev/my-gcp-project/anvil-bot/swap-service:v1.0.0
    ```

### 3. Verify Application Configuration Reading

*   Ensure your Node.js applications (`bot` and `swap`) are configured to read database connection details, RabbitMQ connection details, API keys, and other settings from **environment variables**. The Helm chart templates (`bot-deployment.yaml`, `swap-deployment.yaml`) inject these values as environment variables into the containers.

### 4. Update Helm Dependencies

*   Navigate back to the Helm chart directory (`cd ../anvil-bot-chart`).
*   Download the MongoDB and RabbitMQ dependency charts:
    ```bash
    helm dependency update
    ```
    This will create a `charts/` directory containing the `.tgz` files for the dependencies.

### 5. Deploy using Helm

*   Ensure `kubectl` is configured to point to your target GKE cluster.
*   Run the `helm install` command. Choose a release name (e.g., `my-anvil-bot`) and optionally specify a namespace.
    ```bash
    # Basic deployment using the configured values.yaml
    helm install my-anvil-bot . \
      --namespace anvil-bot-ns \
      --create-namespace \
      -f values.yaml

    # --- OR ---

    # Deployment overriding sensitive values via --set (Recommended for production)
    # helm install my-anvil-bot . \
    #   --namespace anvil-bot-ns \
    #   --create-namespace \
    #   -f values.yaml \
    #   --set bot.secrets.telegramBotToken="YOUR_ACTUAL_TOKEN" \
    #   --set swap.secrets.solanaWalletPrivateKey="YOUR_ACTUAL_KEY" \
    #   --set mongodb.auth.rootPassword="YOUR_SECURE_MONGO_ROOT_PASSWORD" \
    #   --set mongodb.auth.passwords[0]="YOUR_SECURE_MONGO_USER_PASSWORD" \
    #   --set rabbitmq.auth.password="YOUR_SECURE_RABBITMQ_PASSWORD"
    ```
*   Helm will deploy all the resources defined in the chart and its dependencies (Deployments, StatefulSets, Services, Secrets, etc.).

### 6. Verify Deployment

*   Check the status of the deployment:
    ```bash
    helm status my-anvil-bot -n anvil-bot-ns
    ```
*   Check the status of the pods:
    ```bash
    kubectl get pods -n anvil-bot-ns -w
    ```
    Wait for all pods (mongodb, rabbitmq, bot, swap) to reach the `Running` state.
*   Check logs if needed:
    ```bash
    kubectl logs -n anvil-bot-ns -f <pod-name> # e.g., kubectl logs -n anvil-bot-ns -f my-anvil-bot-bot-xxxxx-yyyyy
    ```
*   Interact with your Telegram bot to ensure it's functioning correctly.

## Upgrading the Deployment

*   Make changes to your application code.
*   Rebuild and push new Docker images with updated tags.
*   Update the `image.tag` values in `values.yaml` (or use `--set`).
*   Run `helm upgrade`:
    ```bash
    helm upgrade my-anvil-bot . \
      --namespace anvil-bot-ns \
      -f values.yaml \
      # Add --set flags if needed
    ```

## Uninstalling the Deployment

*   To remove all resources created by the Helm chart:
    ```bash
    helm uninstall my-anvil-bot -n anvil-bot-ns
    ```
*   **Note:** This will typically also delete the Persistent Volume Claims (PVCs) associated with MongoDB and RabbitMQ, **resulting in data loss** unless your `StorageClass` reclaim policy is set to `Retain`. Manually delete Persistent Volumes (PVs) if necessary.
