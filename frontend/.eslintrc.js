module.exports = {
    extends: [
        'react-app',
        'react-app/jest'
    ],
    rules: {
        // Disable some overly strict testing library rules for this project
        'testing-library/no-node-access': 'warn',
        'testing-library/no-container': 'warn',
        'testing-library/no-wait-for-multiple-assertions': 'warn',
        'testing-library/no-wait-for-side-effects': 'warn',
        'testing-library/no-unnecessary-act': 'warn',
        'testing-library/await-async-utils': 'warn',
        'testing-library/no-wait-for-empty-callback': 'warn',

        // Disable some jest rules that are too strict for this project
        'jest/no-conditional-expect': 'warn',
        'jest/no-jasmine-globals': 'warn',

        // Allow unused vars as warnings instead of errors
        '@typescript-eslint/no-unused-vars': 'warn',

        // Allow missing dependencies in useEffect
        'react-hooks/exhaustive-deps': 'warn',

        // Allow redeclare for this project
        '@typescript-eslint/no-redeclare': 'warn',

        // Allow import ordering issues
        'import/first': 'warn',

        // Allow accessibility issues as warnings
        'jsx-a11y/heading-has-content': 'warn'
    }
};