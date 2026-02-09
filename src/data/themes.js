const themesData = [
  {
    id: 1,
    title: 'Light on a Sphere',
    subtitle: 'Optics & Lighting Safety',
    description: 'Explore how light interacts with curved surfaces and its implications for workplace safety.',
    steps: [
      {
        type: 'theory',
        title: 'Light Interaction with Surfaces',
        content:
          'Light interacts with surfaces via reflection and diffusion, affecting visibility and safety in the workplace. When light hits a smooth curved surface like a sphere, it reflects according to the law of reflection — the angle of incidence equals the angle of reflection. On a curved surface, the normal direction changes at every point, causing reflected rays to diverge or converge. Diffuse reflection scatters light in many directions, providing even illumination, while specular reflection can cause bright spots or glare.',
      },
      {
        type: 'scene',
        title: 'Light Reflection on a Sphere',
        sceneKey: 'lightSphere',
      },
      {
        type: 'theory',
        title: 'Practical Safety Implications',
        content:
          'In practice, improper lighting can cause glare hazards that reduce visibility and lead to accidents. Direct glare occurs when a bright light source is in the field of vision. Reflected glare happens when light bounces off shiny surfaces. In industrial settings, proper positioning of light sources and use of matte finishes help minimize these risks. Standards like ISO 8995 define recommended illumination levels for different work environments to ensure safety.',
      },
      {
        type: 'scene',
        title: 'Shadow Casting and Glare',
        sceneKey: 'shadowScene',
      },
    ],
    questions: [
      {
        question: 'What happens to light on a curved surface?',
        options: [
          'Reflects diffusely in multiple directions',
          'Absorbs completely into the surface',
          'Passes through without change',
          'Converts to heat energy only',
        ],
        correctIndex: 0,
      },
      {
        question: 'What is glare in workplace safety?',
        options: [
          'A type of fire hazard',
          'Excessive brightness that causes visual discomfort',
          'A chemical reaction on surfaces',
          'Sound reflection in enclosed spaces',
        ],
        correctIndex: 1,
      },
      {
        question: 'Which standard defines recommended illumination levels?',
        options: ['ISO 9001', 'ISO 8995', 'OSHA 300', 'ANSI Z87.1'],
        correctIndex: 1,
      },
      {
        question: 'How can reflected glare be minimized?',
        options: [
          'Using brighter light sources',
          'Increasing surface shininess',
          'Using matte finishes and proper light positioning',
          'Removing all light sources',
        ],
        correctIndex: 2,
      },
    ],
  },
  {
    id: 2,
    title: 'Falling Object',
    subtitle: 'Mechanics & Impact Safety',
    description: 'Study the physics of falling objects and understand impact energy hazards in the workplace.',
    steps: [
      {
        type: 'theory',
        title: 'Physics of Falling Objects',
        content:
          'When an object falls under gravity, it accelerates at approximately 9.81 m/s². The potential energy (PE = mgh) converts to kinetic energy (KE = ½mv²) as it falls. Upon impact, this energy is transferred to the surface and the object, potentially causing damage or injury. The impact force depends on the mass, height, and the deformation characteristics of both the object and the surface. Understanding these principles is crucial for workplace safety — OSHA requires protection from falling objects in construction and industrial settings.',
      },
      {
        type: 'scene',
        title: 'Free Fall Demonstration',
        sceneKey: 'fallingBox',
      },
      {
        type: 'theory',
        title: 'Safety Measures Against Falling Objects',
        content:
          'Protection against falling objects includes: hard hats (ANSI Z89.1 rated), toe boards on elevated platforms, safety nets, tool lanyards, and barricaded areas below overhead work. The severity of injury depends on the kinetic energy at impact — even a small bolt falling from great height can be lethal. Risk assessment involves calculating the potential energy: a 2 kg tool falling from 10 m has PE = 2 × 9.81 × 10 = 196.2 J, comparable to a low-velocity bullet impact.',
      },
      {
        type: 'scene',
        title: 'Impact Energy Visualization',
        sceneKey: 'impactScene',
      },
    ],
    questions: [
      {
        question: 'What is the formula for potential energy?',
        options: ['PE = mv', 'PE = mgh', 'PE = ½mv²', 'PE = mg/h'],
        correctIndex: 1,
      },
      {
        question: 'At what rate do objects accelerate due to gravity?',
        options: ['5.0 m/s²', '9.81 m/s²', '15.0 m/s²', '1.0 m/s²'],
        correctIndex: 1,
      },
      {
        question: 'Which PPE protects against falling objects?',
        options: ['Safety goggles', 'Hard hat', 'Ear plugs', 'Rubber gloves'],
        correctIndex: 1,
      },
      {
        question:
          'A 2 kg object falls from 10 m. What is its kinetic energy at impact?',
        options: ['98.1 J', '196.2 J', '20 J', '50 J'],
        correctIndex: 1,
      },
      {
        question: 'What standard covers hard hat requirements?',
        options: ['ANSI Z87.1', 'ANSI Z89.1', 'ISO 9001', 'OSHA 1926'],
        correctIndex: 1,
      },
    ],
  },
  {
    id: 3,
    title: 'Electrical Safety',
    subtitle: 'Voltage & Current Hazards',
    description: 'Learn about electrical hazards, safe working distances, and protective measures. (Coming soon)',
    steps: [
      {
        type: 'theory',
        title: 'Introduction to Electrical Safety',
        content:
          'Electrical hazards are among the most dangerous in workplace environments. Electric shock occurs when a person becomes part of an electrical circuit. The severity depends on current magnitude, duration of contact, path through the body, and frequency. As little as 10 mA can cause muscle contractions preventing release, while 100 mA through the heart can be fatal. Ohm\'s law (V = IR) governs the relationship between voltage, current, and resistance.',
      },
      {
        type: 'theory',
        title: 'Safety Precautions',
        content:
          'Key electrical safety measures include: lockout/tagout (LOTO) procedures, insulated tools, ground fault circuit interrupters (GFCIs), maintaining safe distances from energized parts, and proper training. The NFPA 70E standard defines arc flash boundaries and required PPE. Always assume circuits are energized until verified otherwise using a properly rated voltmeter.',
      },
    ],
    questions: [
      {
        question: 'What current level can prevent a person from releasing a conductor?',
        options: ['1 mA', '10 mA', '0.1 mA', '1000 mA'],
        correctIndex: 1,
      },
      {
        question: 'What does LOTO stand for?',
        options: [
          'Lockout/Tagout',
          'Light Out/Turn Off',
          'Low Output/Test Only',
          'Level Out/Tap Out',
        ],
        correctIndex: 0,
      },
      {
        question: 'Which law governs voltage, current, and resistance?',
        options: [
          "Newton's Law",
          "Ohm's Law",
          "Faraday's Law",
          "Hooke's Law",
        ],
        correctIndex: 1,
      },
    ],
  },
];

export default themesData;
