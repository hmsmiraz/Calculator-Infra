pipeline {
  agent { label 'podman-builder' }

  environment {
    PROJECT_ID  = 'miraz001'
    REGION      = 'asia-southeast1'
    REPO        = 'calculator-repo'
    IMAGE_TAG   = "${env.GIT_COMMIT.take(7)}"
    GIT_REPO    = 'https://github.com/hmsmiraz/Calculator-Infra.git'
  }

  stages {
    stage('Checkout') {
      steps { git branch: 'main', url: env.GIT_REPO }
    }

    stage('Auth to GCP + Podman login') {
      steps {
        sh '''
          gcloud auth print-access-token | \
            podman login -u oauth2accesstoken --password-stdin ${REGION}-docker.pkg.dev
        '''
      }
    }

    stage('Build & Push images') {
      steps {
        script {
          def services = ['api-gateway','auth-service','calculator-service','user-service','frontend']
          services.each { svc ->
            sh """
              podman build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${svc}:${IMAGE_TAG} ./${svc}
              podman push ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${svc}:${IMAGE_TAG}
            """
          }
        }
      }
    }

    stage('Bump image tags in GitOps manifest') {
      steps {
        dir('k8s/gitops') {
          script {
            def services = ['api-gateway','auth-service','calculator-service','user-service','frontend']
            services.each { svc ->
              sh "kustomize edit set image ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${svc}=${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${svc}:${IMAGE_TAG}"
            }
          }
        }
        withCredentials([usernamePassword(credentialsId: 'github-pat', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_TOKEN')]) {
          sh '''
            git config user.email "hmsmiraz64729@gmail.com"
            git config user.name  "hmsmiraz"
            git add k8s/gitops/kustomization.yaml
            git commit -m "ci: bump images to ${IMAGE_TAG}" || echo "nothing to commit"
            git push https://${GIT_USER}:${GIT_TOKEN}@github.com/hmsmiraz/Calculator-Infra.git HEAD:main
          '''
        }
      }
    }
  }

  post {
    success { echo "Pushed images tag ${IMAGE_TAG} — ArgoCD will sync within its poll interval." }
  }
}