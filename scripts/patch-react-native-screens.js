const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const targets = [
  path.join(
    root,
    'node_modules',
    'react-native-screens',
    'src',
    'fabric',
    'ScreenStackNativeComponent.ts',
  ),
  path.join(
    root,
    'node_modules',
    'react-native-screens',
    'lib',
    'typescript',
    'fabric',
    'ScreenStackNativeComponent.d.ts',
  ),
  path.join(
    root,
    'node_modules',
    'react-native-screens',
    'src',
    'fabric',
    'SearchBarNativeComponent.ts',
  ),
  path.join(
    root,
    'node_modules',
    'react-native-screens',
    'lib',
    'typescript',
    'fabric',
    'SearchBarNativeComponent.d.ts',
  ),
];

const replacements = [
  {
    needle:
      '  iosPreventReattachmentOfDismissedScreens?: CT.WithDefault<boolean, true>;\n',
    replacement:
      '  // Patched for RN 0.79 / Expo 53 compatibility. This newer codegen prop is iOS-only.\n',
  },
  {
    needle: '?: CT.DirectEventHandler<SearchBarEvent> | null;',
    replacement: '?: CT.DirectEventHandler<SearchBarEvent>;',
  },
  {
    needle: '?: DirectEventHandler<SearchBarEvent> | null;',
    replacement: '?: DirectEventHandler<SearchBarEvent>;',
  },
  {
    needle: '?: CT.DirectEventHandler<SearchButtonPressedEvent> | null;',
    replacement: '?: CT.DirectEventHandler<SearchButtonPressedEvent>;',
  },
  {
    needle: '?: DirectEventHandler<SearchButtonPressedEvent> | null;',
    replacement: '?: DirectEventHandler<SearchButtonPressedEvent>;',
  },
  {
    needle: '?: CT.DirectEventHandler<ChangeTextEvent> | null;',
    replacement: '?: CT.DirectEventHandler<ChangeTextEvent>;',
  },
  {
    needle: '?: DirectEventHandler<ChangeTextEvent> | null;',
    replacement: '?: DirectEventHandler<ChangeTextEvent>;',
  },
];

let patchedAny = false;

for (const target of targets) {
  if (!fs.existsSync(target)) {
    continue;
  }

  const original = fs.readFileSync(target, 'utf8');
  let next = original;

  for (const { needle, replacement } of replacements) {
    if (!next.includes(needle)) {
      continue;
    }

    next = next.replaceAll(needle, replacement);
  }

  if (next === original) {
    continue;
  }

  fs.writeFileSync(target, next, 'utf8');
  patchedAny = true;
  console.log(`Patched ${path.relative(root, target)}`);
}

if (!patchedAny) {
  console.log('react-native-screens patch not needed');
}
