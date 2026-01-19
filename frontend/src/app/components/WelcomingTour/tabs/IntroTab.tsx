import React from 'react';

const IntroTab: React.FC = () => {
    return (
        <div>
            <h1>Introduction to LLM Providers</h1>
            <p>
                Large Language Model (LLM) providers are platforms that offer access to advanced AI models capable of understanding and generating human-like text. 
                These models can be utilized for various applications, including customer service, content creation, and data analysis.
            </p>
            <p>
                Choosing the right LLM provider depends on various factors, including performance, cost, data privacy, and specific use cases. 
                Evaluating different providers allows users to find the best fit for their needs and ensures optimized outcomes for their projects.
            </p>
            <div className="provider-summary-cards">
                <ProviderSummaryCard name="Local Models" description="Run AI models locally with full control over data and processing." />
                <ProviderSummaryCard name="Google Gemini" description="A powerful cloud-based solution with enhanced capabilities and integrations." />
                <ProviderSummaryCard name="OpenRouter" description="Flexible access to multiple LLMs through a single interface." />
            </div>
        </div>
    );
};

export default IntroTab;