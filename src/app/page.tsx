"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
} from "chart.js";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  CategoryScale
);

type AuditElement = {
  private: {
    code: string;
  };
  grade: string | null;
  resultId: string | null;
  group: {
    captainLogin: string;
    createdAt: string;
    object: {
      name: string;
      type: string;
    };
  };
};

export default function Home() {
  const [Xp, setXp] = useState("");
  const [Done, setDone] = useState("");
  const [Receive, setReceive] = useState("");
  const [Ratio, setRatio] = useState("");
  const [id, setId] = useState("");
  const [Audit, setAudit] = useState("");
  const [UserInfo, setUser] = useState<Record<string, string>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [xpProjects, setXPProjects] = useState<React.ReactNode>(null);
  const [xpEvolution, setXPEvolution] = useState<
    { date: string; xp: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [newGraphData, setNewGraphData] = useState([]);

  useEffect(() => {
    if (!document.cookie.includes("token")) {
      document.location.href = "/login";
    } else {
      fetch("https://zone01normandie.org/api/graphql-engine/v1/graphql", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + getToken(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `query {
            transaction_aggregate(where: {
              type: { _eq: "xp" },
              eventId: { _eq: 303 }
            }) {
              aggregate {
                sum {
                  amount
                }
              }
            }
          }`,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          const amount = data.data.transaction_aggregate.aggregate.sum.amount;
          if (amount >= 1000 && amount <= 999999) {
            setXp((amount / 1000).toFixed(2) + " Kb");
          } else if (amount >= 1000000) {
            setXp((amount / 1000000).toFixed(2) + " Mb");
          } else {
            setXp(amount + " b");
          }
        });

      fetch("https://zone01normandie.org/api/graphql-engine/v1/graphql", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + getToken(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `query {
            user {
              attrs
              login
              totalUp
              totalDown
            }
          }`,
        }),
      }).then((response) => {
        response.json().then((data) => {
          const user = data.data.user[0];
          const amount_done = user.totalUp;
          const amount_receive = user.totalDown;

          setUser(user.attrs);
          setId(user.login);

          if (amount_done >= 1000 && amount_done <= 999999) {
            setDone((amount_done / 1000).toFixed(2) + " Kb");
          } else if (amount_done >= 1000000) {
            setDone((amount_done / 1000000).toFixed(2) + " Mb");
          } else {
            setDone(amount_done + " b");
          }

          if (amount_receive >= 1000 && amount_receive <= 999999) {
            setReceive((amount_receive / 1000).toFixed(2) + " Kb");
          } else if (amount_receive >= 1000000) {
            setReceive((amount_receive / 1000000).toFixed(2) + " Mb");
          } else {
            setReceive(amount_receive + " b");
          }

          setRatio(" " + (amount_done / amount_receive).toFixed(1));
          setLoading(false);
        });
      });
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetch("https://zone01normandie.org/api/graphql-engine/v1/graphql", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + getToken(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `query {
            audit(where: {auditorLogin: {_eq: "${id}"}}) {
              private {
                code
              }
              grade
              resultId
              group {
                captainLogin
                createdAt
                object {
                  name
                  type
                }
              }
            }
          }`,
        }),
      }).then((response) => {
        response.json().then((data) => {
          const audits = data.data.audit;
          let content = "";

          audits.forEach((element: AuditElement) => {
            if (element.grade === null && element.resultId === null) {
              content = `You have an audit to do on ${element.group.object.name} from ${element.group.captainLogin}. Your code is ${element.private.code}`;
              return;
            } else {
              content = "No audit to do. You're good!";
            }
          });

          setAudit(content);
        });
      });
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetch("https://zone01normandie.org/api/graphql-engine/v1/graphql", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + getToken(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `query {
  xp_view {
    amount
    pathByPath {
      object {
        name
        type
      }
    }
  }
}`,
        }),
      }).then((response) => {
        response.json().then((data) => {
          const chart = <XPBarChart data={data.data} />;
          console.log(data);
          setXPProjects(chart);
        });
      });
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetch("https://zone01normandie.org/api/graphql-engine/v1/graphql", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + getToken(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `query {
            transaction(where: {userLogin: {_eq: "${id}"}, type: {_eq: "xp"}}) {
              amount
              createdAt
            }
          }`,
        }),
      }).then((response) => {
        response.json().then((data) => {
          const transactions = data.data.transaction;
          const xpData = transactions.map(
            (transaction: { amount: number; createdAt: string }) => ({
              date: transaction.createdAt,
              xp: transaction.amount,
            })
          );

          let cumulativeXP = 0;
          const cumulativeXPData = xpData.map(
            (entry: { date: string; xp: number }) => {
              cumulativeXP += entry.xp;
              return { date: entry.date, xp: cumulativeXP };
            }
          );

          setXPEvolution(cumulativeXPData);
        });
      });
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetch("https://zone01normandie.org/api/graphql-engine/v1/graphql", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + getToken(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `query {
            user(where: {login: {_eq: "${id}"}}) {
              events(where: { event: { object: { type: { _in: ["piscine", "module"] } } } }) {
                event {
                  id
                  object {
                    name
                    type
                  }
                }
              }
            }
          }`,
        }),
      }).then((response) => {
        response.json().then((data) => {
          if (data.data && data.data.user[0] && data.data.user[0].events) {
            const events = data.data.user[0].events.map(
              (event: {
                event: { object: { name: string; type: string }; id: number };
              }) => ({
                label: event.event.object.name,
                value: event.event.id,
              })
            );
            setNewGraphData(events);
          } else {
            setNewGraphData([]);
          }
        });
      });
    }
  }, [id]);

  const handleLogout = () => {
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.location.href = "/login";
  };

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const xpEvolutionData = {
    labels: xpEvolution.map((data) => new Date(data.date).toLocaleDateString()),
    datasets: [
      {
        label: "XP Evolution",
        data: xpEvolution.map((data) => data.xp),
        fill: false,
        borderColor: "teal",
        tension: 0.1,
      },
    ],
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button onClick={handleLogout} className={styles.button}>
          Logout
        </button>
        <button onClick={toggleModal} className={styles.button}>
          Profile
        </button>
      </header>

      {loading ? (
        <div className={styles.spinner}></div>
      ) : (
        <main className={styles.main}>
          <section id="Xp" className={styles.section}>
            <p>Your total Xp : {Xp}</p>
          </section>
          <section id="audit_ratio" className={styles.section}>
            <p>
              Done : <span style={{ color: "green" }}>{Done}</span>{" "}
            </p>
            <p>
              Receive : <span style={{ color: "red" }}>{Receive}</span>
            </p>
            <p>
              {" "}
              Ratio :
              <span
                style={{
                  ...{ fontWeight: "bold" },
                  color: parseFloat(Ratio) > 1 ? "green" : "red",
                }}
              >
                {Ratio}
              </span>
            </p>
            <AuditRatioGraph
              done={parseFloat(Done)}
              receive={parseFloat(Receive)}
            />
          </section>
          <section id="audit_requests" className={styles.section}>
            <p>
              Audits : <br />
              {Audit}
            </p>
          </section>

          <section id="projects_xp" className={styles.section}>
            {xpProjects}
          </section>

          <section id="xp_evolution" className={styles.section}>
            <Line
              data={xpEvolutionData}
              style={{ width: "600px", height: "300px" }}
            />
          </section>
          <section id="new_graph" className={styles.section}>
            <NewGraph data={newGraphData} />
          </section>
        </main>
      )}

      {isModalOpen && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <span className={styles.close} onClick={toggleModal}>
              &times;
            </span>
            <section id="user_infos">
              {Object.entries(UserInfo).map(([key, value]) => (
                <div key={key}>
                  <strong>{key}:</strong> {value}
                </div>
              ))}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

export const getToken = () => {
  const cookies = document.cookie.split("; ");
  for (const cookie of cookies) {
    const [name, value] = cookie.split("=");
    if (name === "token") {
      return value;
    }
  }
  return null;
};

interface XPData {
  amount: number;
  pathByPath: {
    object: {
      name: string;
      type: string;
    };
  };
}

interface XPChartProps {
  data: {
    xp_view: XPData[];
  };
}

const XPBarChart: React.FC<XPChartProps> = ({ data }) => {
  console.log(data);
  if (!data || !data.xp_view) return <p>Aucune donnée disponible</p>;

  const chartData = data.xp_view
    .filter((item) => item.pathByPath.object.type === "project")
    .map((item) => ({
      name: item.pathByPath.object.name,
      xp: item.amount,
    }))
    .sort((a, b) => a.xp - b.xp);

  if (chartData.length === 0) return <p>Aucun projet trouvé</p>;

  const maxXP = Math.max(...chartData.map((d) => d.xp), 1);

  const width = 800;
  const height = 400;
  const margin = { top: 40, right: 30, bottom: 40, left: 40 };
  const barWidth = (width - margin.left - margin.right) / chartData.length;

  return (
    <svg width={width} height={height} style={{ background: "none" }}>
      <text
        x={width / 2}
        y={margin.top / 2}
        textAnchor="middle"
        fontSize="25"
        fill="grey"
      >
        XP par projet
      </text>
      <g transform={`translate(${margin.left},${margin.top})`}>
        {chartData.map((item, index) => {
          const barHeight =
            (item.xp / maxXP) * (height - margin.top - margin.bottom);
          return (
            <g key={index} transform={`translate(${index * barWidth}, 0)`}>
              <rect
                x={0}
                y={height - margin.bottom - barHeight}
                width={barWidth - 10}
                height={barHeight}
                fill="teal"
                rx="5"
                style={{ transition: "height 0.5s ease-out" }}
              >
                <title>{`${item.name}: ${item.xp} XP`}</title>
              </rect>
              <text
                x={barWidth / 2 - 5}
                y={height - margin.bottom + 15}
                textAnchor="middle"
                fontSize="10"
                fill="#333"
              >
                {item.name}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
};

interface NewGraphData {
  label: string;
  value: number;
}

const NewGraph: React.FC<{ data: NewGraphData[] }> = ({ data }) => {
  const width = 800;
  const height = 400;
  const margin = { top: 40, right: 30, bottom: 40, left: 40 };
  const barWidth = (width - margin.left - margin.right) / data.length;

  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <svg width={width} height={height} style={{ background: "none" }}>
      <text
        x={width / 2}
        y={margin.top / 2}
        textAnchor="middle"
        fontSize="25"
        fill="grey"
      >
        Piscines
      </text>
      <g transform={`translate(${margin.left},${margin.top})`}>
        {data.map((item, index) => {
          const barHeight =
            (item.value / maxVal) * (height - margin.top - margin.bottom);
          return (
            <g key={index} transform={`translate(${index * barWidth}, 0)`}>
              <rect
                x={0}
                y={height - margin.bottom - barHeight}
                width={barWidth - 10}
                height={barHeight}
                fill="teal"
                rx="5"
                style={{ transition: "height 0.5s ease-out" }}
              >
                <title>{`${item.label}: ${item.value}`}</title>
              </rect>
              <text
                x={barWidth / 2 - 5}
                y={height - margin.bottom + 15}
                textAnchor="middle"
                fontSize="10"
                fill="#333"
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
};

const AuditRatioGraph: React.FC<{ done: number; receive: number }> = ({
  done,
  receive,
}) => {
  const width = 800;
  const height = 400;
  const margin = { top: 40, right: 30, bottom: 40, left: 40 };

  const data = [
    { label: "Done", value: done },
    { label: "Receive", value: receive },
  ];

  const maxVal = Math.max(done, receive, 1);
  const barWidth = (width - margin.left - margin.right) / data.length;

  return (
    <svg width={width} height={height} style={{ background: "none" }}>
      <text
        x={width / 2}
        y={margin.top / 2}
        textAnchor="middle"
        fontSize="25"
        fill="grey"
      >
        Audit Ratio
      </text>
      <g transform={`translate(${margin.left},${margin.top})`}>
        {data.map((item, index) => {
          const barHeight =
            (item.value / maxVal) * (height - margin.top - margin.bottom);
          return (
            <g key={index} transform={`translate(${index * barWidth}, 0)`}>
              <rect
                x={0}
                y={height - margin.bottom - barHeight}
                width={barWidth - 10}
                height={barHeight}
                fill={item.label === "Done" ? "green" : "red"}
                rx="5"
                style={{ transition: "height 0.5s ease-out" }}
              >
                <title>{`${item.label}: ${item.value}`}</title>
              </rect>
              <text
                x={barWidth / 2 - 5}
                y={height - margin.bottom + 15}
                textAnchor="middle"
                fontSize="10"
                fill="#333"
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
};
