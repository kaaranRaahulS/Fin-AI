# FIN-AI — Intelligent Personal Finance Management Platform

FIN-AI is a mobile-first personal finance management system designed to help individuals and families track spending, manage budgets, optimize credit card usage, and detect anomalous financial behavior.

The system integrates machine learning–based recommendations, time-series forecasting, conversational AI using a locally hosted LLM (Ollama), and real-time security monitoring through Splunk. FIN-AI emphasizes affordability, transparency, privacy preservation, and scalability, and is documented through an IEEE-formatted technical paper included in this repository.

![React Native](https://img.shields.io/badge/React_Native-20232A?style=flat&logo=react)
![Expo](https://img.shields.io/badge/Expo-000000?style=flat&logo=expo)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase)
![Plaid](https://img.shields.io/badge/Plaid-000000?style=flat)
![Splunk](https://img.shields.io/badge/Splunk-000000?style=flat&logo=splunk)
![Machine Learning](https://img.shields.io/badge/Machine_Learning-blue)

# Description
FIN-AI is a mobile-first personal finance management system designed to help individuals and families better understand, manage, and optimize their financial behavior. This repository accompanies the IEEE technical paper “FIN-AI: An Intelligent, Secure, and Predictive Mobile Platform for Family Personalized Financial Management” and documents the system architecture, methodologies, and design decisions behind the project.

The platform integrates secure financial data aggregation, machine learning–driven credit card recommendations, time-series forecasting, conversational AI for budgeting assistance, and real-time security monitoring. Built using React Native with Expo, Node.js, MongoDB, Firebase Authentication, the Plaid API, and Splunk, FIN-AI emphasizes affordability, transparency, privacy, and scalability.

A hybrid machine learning pipeline combines interpretable models such as logistic regression with ensemble methods including random forests and time-series forecasting to predict optimal credit card usage and future spending patterns. An Ollama-based locally hosted large language model (LLM) enables natural-language interaction for budget creation and financial insights while preserving user privacy by avoiding external AI APIs. System-wide observability and security are enforced through Splunk dashboards, including backend logging and traffic flow analysis for anomaly detection.

This repository includes the final IEEE-formatted technical paper, system diagrams, and supporting documentation. FIN-AI demonstrates how modern mobile development, applied machine learning, and security monitoring can be unified into a cohesive, real-world financial application.
