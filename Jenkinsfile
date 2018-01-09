pipeline {
    agent any
    tools {
        maven 'Maven 3.3.9'
        jdk 'jdk8'
    }
    stages {
        stage ('Initialize') {
            steps {
                sh '''
                    echo "PATH = ${PATH}"
                    echo "M2_HOME = ${M2_HOME}"
                '''
            }
        }
        stage ('Build') {
            steps {
                sh 'mvn -Dmaven.test.failure.ignore=true install'
            }
            post {
                success {
                    juint 'target/surefile-reports/**/*.xml'
                }
            }
        }
        stage ('Docker Build') {
            steps {
                script
                {
                    docker.build("$DOCKER_IMAGE:${env.BUILD_ID}") 
                }
            }
        }
        stage ('Docker Push') {
            steps {
                script {
                    // Push the Docker image to ECR
                    docker.withRegistry(DOCKER_URL, DOCKER_CRED)
                    {
                        docker.image(DOCKER_IMAGE).push("${env.BUILD_ID}")
                    }
                }
            }
        }
    }
}